#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod globals;
mod fs_utils;
mod printer_fn;
mod image_fn;
mod chromokey_fn;
mod work_hours_fn;
mod init_project_fn;
mod license;

use globals::{LicenseState, PrinterState, PROJECT_PATH, TemplatePaths};
use init_project_fn::{get_projects, select_project, delete_project, load_project_name};
use printer_fn::{saving_printer_data, get_printers_info, update_selected_printer, printer_information, printer_settings, printer_status};
use image_fn::{delete_image, get_image_path, save_image, get_image_paths};
use chromokey_fn::{save_settings, read_settings};
use work_hours_fn::{get_work_hours, set_work_hours};
use license::{verify_license, check_license};

use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::os::windows::process::CommandExt;
use windows_sys::Win32::System::Threading::CREATE_NO_WINDOW;

use std::ffi::CString;
use device_query::{DeviceQuery, DeviceState, Keycode};
use std::result::Result;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, CustomMenuItem, Manager, Menu};
use std::time::{Duration, Instant};
use std::{fs, thread};
use base64::prelude::*;
use std::fs::File;
use std::collections::HashMap;
use mime_guess::MimeGuess;
use std::io::Write;
// use std::path::PathBuf;
use std::env;
use serde_json::Value;
use libc::{c_void, c_uint, c_int, c_char};
use tauri::State;
use chrono::Local;

type EdsError = c_int;
type EdsCameraRef = *mut c_void;
// type EdsDirectoryItemRef = *mut c_void;
type EdsUInt32 = c_uint;
type EdsPropertyID = c_uint;
type EdsStateEvent = c_uint;
type EdsObjectEvent = c_uint;
type EdsPropertyEvent = c_uint;
type EdsBaseRef = *mut c_void;
type EdsVoid = c_void;

use serde::{Deserialize, Serialize};

#[link(name = "EDSDK")]
extern "C" {
    fn EdsInitializeSDK() -> u32;
    fn EdsTerminateSDK() -> u32;
    fn EdsGetCameraList(camera_list: *mut *mut c_void) -> u32;
    fn EdsGetChildCount(inRef: *mut c_void, outCount: *mut u32) -> u32;
    fn EdsGetChildAtIndex(inRef: *mut c_void, index: u32, outRef: *mut *mut c_void) -> u32;
    fn EdsOpenSession(camera: *mut c_void) -> u32;
    fn EdsCloseSession(camera: *mut c_void) -> u32;
    fn EdsSendCommand(camera: *mut c_void, command: u32, param: u32) -> u32;
    fn EdsGetDirectoryItemInfo(dir_item: *mut c_void, dir_item_info: *mut EdsDirectoryItemInfo) -> u32;
    fn EdsCreateMemoryStream(size: u64, stream: *mut *mut c_void) -> u32;
    fn EdsDownload(dir_item: *mut c_void, size: u64, stream: *mut c_void) -> u32;
    fn EdsDownloadComplete(dir_item: *mut c_void) -> u32;
    fn EdsGetPointer(stream: *mut c_void, pointer: *mut *mut u8) -> u32;
    fn EdsGetLength(stream: *mut c_void, length: *mut u64) -> u32;
    fn EdsRelease(ref_: *mut c_void) -> u32;
    // fn EdsDeleteDirectoryItem(dir_item: *mut c_void) -> u32;
    fn EdsCreateEvfImageRef(stream: *mut c_void, evfImage: *mut *mut c_void) -> u32;
    fn EdsDownloadEvfImage(camera: *mut c_void, evfImage: *mut c_void) -> u32;
    fn EdsGetPropertyData(ref_: *mut c_void, prop_id: u32, param: u32, size: u32, out_data: *mut c_void) -> u32;
    // fn EdsSetPropertyData(camera: *mut c_void, prop_id: u32, param: u32, size: u32, in_data: *const i64) -> u32;
    fn EdsSetPropertyData(camera: *mut c_void, prop_id: u32, param: u32, size: u32, in_data: *const c_void) -> u32;
    
    // fn EdsSetPropertyEventHandler(camera: *mut c_void, event: c_uint, event_handler: extern "C" fn(c_uint, *mut c_void, *mut c_void) -> c_int, context: *mut c_void) -> c_int;
    // fn EdsSetObjectEventHandler(camera: *mut c_void, event: c_uint, event_handler: extern "C" fn(c_uint, c_uint, c_uint, *mut c_void) -> c_int, context: *mut c_void) -> c_int;
    // fn EdsSetCameraStateEventHandler(camera: *mut c_void, event: c_uint, event_handler: extern "C" fn(c_uint, c_uint, *mut c_void) -> c_int, context: *mut c_void) -> c_int;
    
    fn EdsSetObjectEventHandler(camera: EdsCameraRef, event: EdsObjectEvent, handler: extern "C" fn(EdsObjectEvent, EdsBaseRef, *mut EdsVoid) -> EdsError, context: *mut EdsVoid) -> EdsError;
    fn EdsSetPropertyEventHandler(camera: EdsCameraRef, event: EdsPropertyEvent, handler: extern "C" fn(EdsPropertyEvent, EdsPropertyID, EdsUInt32, *mut EdsVoid) -> EdsError, context: *mut EdsVoid) -> EdsError;
    fn EdsSetCameraStateEventHandler(camera: EdsCameraRef, event: EdsStateEvent, handler: extern "C" fn(EdsStateEvent, EdsUInt32, *mut EdsVoid) -> EdsError, context: *mut EdsVoid) -> EdsError;

    fn EdsCreateFileStream(
        in_file_name: *const c_char,
        in_create_disposition: c_int,
        in_desired_access: c_uint,
        out_stream: *mut *mut c_void,
    ) -> c_uint;

    fn EdsGetEvent() -> u32;
    fn EdsSetCapacity(camera: *mut c_void, capacity: EdsCapacity) -> u32;
}
#[repr(C)]
pub struct EdsDirectoryItemInfo {
    pub size: u64,
    pub is_folder: i32,
    pub group_id: u32,
    pub option: u32,
    pub sz_file_name: [i8; 256],
}
#[repr(C)]
pub struct EdsCapacity {
    number_of_free_clusters: i32,
    bytes_per_sector: i32,
    reset: bool,
}

#[derive(Debug)]
struct Camera {
    camera_ref: *mut c_void,
    is_live_view_started: bool,
    photo_created: Arc<Mutex<bool>>,
    auto_focus_enabled: bool,
}


unsafe impl Send for Camera {}
unsafe impl Sync for Camera {}

impl Camera {
    fn new() -> Result<Arc<Mutex<Self>>, u32> {
        unsafe {
            let err = EdsInitializeSDK();
            // println!("EdsInitializeSDK: {}", err);
            if err != 0 {
                if err == 2 { // Убедитесь, что код ошибки 2 соответствует вашей логике
                    // println!("[WARNING] Camera busy or session error. Retrying...");
                    // EdsCloseSession(camera_ref_in); // Закрытие на случай повторного открытия
                    // EdsRelease(camera_ref_in);
                    EdsTerminateSDK();
                    // Используем ограничение на количество попыток вместо рекурсии
                    // for _ in 0..3 {
                        std::thread::sleep(std::time::Duration::from_secs(1));
                        if let Ok(camera) = Self::new() {
                            camera.lock().unwrap().start_live_view().unwrap();

                            return Ok(camera);
                        }
                    // }
                }
                return Err(err);
            }

            let mut camera_list: *mut c_void = std::ptr::null_mut();
            let err = EdsGetCameraList(&mut camera_list);
            // println!("EdsGetCameraList: {}", err);
            if err != 0 {
                EdsTerminateSDK();
                return Err(err);
            }

            let mut camera_count: u32 = 0;
            let err = EdsGetChildCount(camera_list, &mut camera_count);
            if err != 0 || camera_count == 0 {
                EdsRelease(camera_list);
                EdsTerminateSDK();
                return Err(err);
            }

            let mut camera_ref_in: *mut c_void = std::ptr::null_mut();
            let err = EdsGetChildAtIndex(camera_list, 0, &mut camera_ref_in);
            // println!("EdsGetChildAtIndex: {}", err);
            EdsRelease(camera_list);
            if err != 0 {
                EdsTerminateSDK();
                return Err(err);
            }

            let err = EdsOpenSession(camera_ref_in);
            // println!("EdsOpenSession: {}", err);
            if err != 0 {
                EdsRelease(camera_ref_in);
                EdsTerminateSDK();
                return Err(err);
            }

            let mut save_target: u32 = 2;
            let capacity = EdsCapacity {
                number_of_free_clusters: 0x7FFFFFFF,  // Проверь, не слишком ли большое значение
                bytes_per_sector: 512,                // Убедись, что камера поддерживает 0x1000
                reset: true,
            };            

            let result = EdsSetPropertyData(
                camera_ref_in,
                0x0000000b,
                0,
                4,
                &mut save_target as *mut _ as *mut c_void,
            );
            if result != 0 {
                eprintln!("[ERROR] Failed to set save target. Error code: 0x{:X}", result);
            }
            println!("[LOG] Save target set successfully.");
    
            // Установка емкости
            let result = EdsSetCapacity(camera_ref_in, capacity);
            if result != 0 {
                eprintln!("[ERROR] Failed to set capacity. Error code: 0x{:X}", result);
            }

            

            EdsRelease(camera_list);
            let camera = Arc::new(Mutex::new(Camera {
                camera_ref: camera_ref_in,
                is_live_view_started: false,
                photo_created: Arc::new(Mutex::new(false)),
                auto_focus_enabled: false, // По умолчанию автофокус выключен
                // photo_created: Arc::new((Mutex::new(false), Condvar::new())),
            }));

            // println!("[INFO] Camera initialized successfully.");
            Ok(camera)
        }
    }

    extern "C" fn handle_object_event( event: EdsObjectEvent, object: EdsBaseRef, context: *mut EdsVoid) -> EdsError {
        println!("[LOG] Object event triggered: 0x{:X}", event);
        if event == 0x00000208 {
            let path = tauri::api::path::data_dir().unwrap();
            let err = Self::download_image( object, path.join("captured_image.jpg").to_str().expect("REASON"), context);
            if err != 0 {
                // println!("[ERROR] Failed to download image: 0x{:?}", err);
            }
            if !object.is_null() {
                unsafe { EdsRelease(object); }
            }         
        }
        0
    }

    extern "C" fn handle_property_event(_event: EdsPropertyEvent, property_id: EdsPropertyID, _param: EdsUInt32, _context: *mut EdsVoid) -> EdsError {
        println!("[LOG] Property event triggered: 0x{:X}", property_id);
        // Обработка события свойства
        0
    }

    extern "C" fn handle_state_event(event: EdsStateEvent, _param: EdsUInt32, context: *mut EdsVoid) -> EdsError {
        println!("[LOG] State event triggered: 0x{:X}", event);
        match event {
            0x00000301 => {
                let camera = unsafe { &mut *(context as *mut Camera) };
                unsafe {
                    EdsRelease(camera.camera_ref);
                    EdsCloseSession(camera.camera_ref);
                    EdsTerminateSDK();
                }
                // unsafe {
                //     EdsRelease(camera.camera_ref);
                //     EdsTerminateSDK();
                // }
            }
            0x00000305 => {
                    // let camera = unsafe { &mut *(context as *mut Camera) };
                    // unsafe {
                    //     EdsRelease(camera.camera_ref);
                    //     EdsCloseSession(camera.camera_ref);
                    //     EdsTerminateSDK();
                    // }
                    println!("[INFO] Camera disconnected.");
                    // let camera_new = Camera::new().unwrap();
                    // let mut camera_lock = camera_new.lock().unwrap();
                    // let _ = camera_lock.capture_photo();
                    // println!("[INFO] Camera connected.");
            }
            _ => {
                // println!("[LOG] State event triggered: 0x{:X}", event);
            }
        }
        // println!("[LOG] State event triggered: 0x{:X}", event);

        0
    }

    fn capture_photo(&mut self, autofocus_enabled: bool) -> Result<(), u32> {
        unsafe {
            
    
            // Установка обработчиков событий
            self.stop_live_view().unwrap();
            
            if EdsSetObjectEventHandler(self.camera_ref, 0x00000200, Camera::handle_object_event, self as *const _ as *mut EdsVoid) != 0 {
                eprintln!("[ERROR] Failed to set object event handler.");
                // return Err(1);
            }
            if EdsSetPropertyEventHandler(self.camera_ref, 0x00000100, Camera::handle_property_event, std::ptr::null_mut()) != 0 {
                eprintln!("[ERROR] Failed to set property event handler.");
                // return Err(2);
            }
            if EdsSetCameraStateEventHandler(self.camera_ref, 0x00000300, Camera::handle_state_event, self as *const _ as *mut EdsVoid) != 0 {
                eprintln!("[ERROR] Failed to set camera state event handler.");
                // return Err(3);
            }
            // println!("[LOG] Event handlers set successfully.");

            // Установка цели сохранения
            
            // println!("[LOG] Capacity set successfully.");
            // let mut save_target: u32 = 0;
            // let mut err = EdsGetPropertyData(self.camera_ref, 0x0000000b, 0, 4, &save_target as *const _ as *mut c_void);
            // if save_target != 2 {
            //     save_target |= 2;
            //     err = EdsSetPropertyData(self.camera_ref, 0x0000000b, 0, 4, &save_target as *const _ as *mut c_void);
            // }
            // Отправка команды на съемку
            // thread::sleep(Duration::from_millis(100));
            // let result = EdsSendCommand(self.camera_ref, 0x00000000, 0x00000000);
            // if result != 0 {
            //     // eprintln!("[ERROR] Failed to send capture command (1). Error code: 0x{:X}", result);
            //     return Err(result);
            // }

            let max_retries = 10; // Максимальное количество попыток
            let mut attempts = 0;

            while attempts < max_retries {
                let mut result;
                if autofocus_enabled {
                    println!("[LOG] Auto focus enabled.");

                    result = EdsSendCommand(self.camera_ref, 0x00000004, 0x00000001); // Halfway
                    if result != 0 {
                        eprintln!("[ERROR] Failed to activate autofocus (Halfway). Error: 0x{:X}", result);
                        attempts += 1;
                        continue;
                    }
                    result = EdsSendCommand(self.camera_ref, 0x00000004, 0x00000003); // Автофокус
                } else {
                    println!("[LOG] Auto focus disabled.");
                    result = EdsSendCommand(self.camera_ref, 0x00000004, 0x00010003); // Без автофокуса
                };
                
                if result == 0 {
                    let result = EdsSendCommand(self.camera_ref, 0x00000004, 0x00000000);
                    println!("[INFO] Capture command sent successfully.{}", result);
                    break; // Успешное выполнение команды — выходим из цикла
                } else {

                    eprintln!("[ERROR] Failed to send capture command (attempt {}). Error code: 0x{:X}", attempts + 1, result);

                    if result == 0x8D07 {
                        let mut save_target: u32 = 2;

                        let result = EdsSetPropertyData(
                            self.camera_ref,
                            0x0000000b,
                            0,
                            4,
                            &mut save_target as *mut _ as *mut c_void,
                        );
                        if result != 0 {
                            eprintln!("[ERROR] Failed to set save target. Error code: 0x{:X}", result);
                        }
                        
                        let result = EdsSendCommand(self.camera_ref, 0x00000004, 0x00000000);
                        if result == 0 {
                            break;
                            // println!("Nice ");
                        }
                    } else if result == 0x00000081 {
                        eprintln!("[ERROR] Device is busy. Retrying...");
                    } else {
                        eprintln!("[ERROR] Failed to send capture command (attempt {}). Error code: 0x{:X}", attempts + 1, result);
                    }
                    let result = EdsSendCommand(self.camera_ref, 0x00000004, 0x00000000);
                    if result == 0 {
                        break;
                        // println!("Nice ");
                    }
                    attempts += 1;

                    // Здесь можно добавить задержку перед следующей попыткой, если нужно
                    std::thread::sleep(std::time::Duration::from_millis(200)); // Задержка 500 мс
                }
            }

            if attempts == max_retries {
                eprintln!("[ERROR] All attempts to send capture command failed.");
                // return Err(1); // Возвращаем ошибку после всех попыток
            }

            println!("[LOG] Photo capture commands sent successfully.");

            // Ожидаем завершения создания фотографии
            loop {
                {
                    let mut photo_created = self.photo_created.lock().unwrap();
                    if *photo_created {
                        *photo_created = false;
                        break; // Выходим из цикла, если фото создано
                    }
                }
            
                EdsGetEvent();  // Запрашиваем события камеры
                thread::sleep(Duration::from_millis(100)); // Даем камере время на обработку
            
                println!("[LOG] Waiting for photo creation...");
            }
            
            // let (look, cvar) = &*self.photo_created;
            // let mut photo_created = look.lock().unwrap();

            // loop {
            //     // Проверяем событие камеры
            //     EdsGetEvent();
            //     println!("[LOG] Waiting for photo creation...");

            //     // Пробуем подождать, но если таймаут — продолжаем цикл
            //     let result = cvar.wait_timeout(photo_created, Duration::from_millis(200)).unwrap();
            //     photo_created = result.0;

            //     // Если фото создано — выходим
            //     if *photo_created {
            //         break;
            //     }
            // }


            

            println!("[LOG] Photo captured successfully.");
                // drop(photo_created); // Drop the immutable borrow before calling the mutable borrow

            // drop(photo_created); // Drop the immutable borrow before calling the mutable borrow
            // self.start_live_view().unwrap();
            Ok(())
        }
    }


    fn download_image(directory_item: *mut c_void, file_name: &str, context: *mut EdsVoid) -> EdsError {
        unsafe {
            let camera =  &*(context as *mut Camera);
            let c_file_name = CString::new(file_name).expect("Failed to create CString");
            let mut dir_item_info = EdsDirectoryItemInfo {
                size: 0,
                is_folder: 0,
                group_id: 0,
                option: 0,
                sz_file_name: [0; 256],
            };

            // Получаем информацию о элементе директории
            let err = EdsGetDirectoryItemInfo(directory_item, &mut dir_item_info);
            if err != 0 {
                // println!("[ERROR] Failed to get directory item info: 0x{:X}", err);
                // return Err(err);
            }

            let mut stream: *mut c_void = std::ptr::null_mut();
            let err = EdsCreateFileStream(c_file_name.as_ptr(), 1, 2, &mut stream);
            if err != 0 {
                // println!("[ERROR] Failed to create file stream: 0x{:X}", err);
                // return Err(err);
            }
            // Создаем поток в памяти для сохранения изображения
            // err = unsafe { EdsCreateMemoryStream(dir_item_info.size, &mut stream) };
            // if err != 0 {
            //     println!("[ERROR] Failed to create memory stream: 0x{:X}", err);
            //     return err.try_into().unwrap();
            // }

            // Скачиваем изображение в поток
            let err = EdsDownload(directory_item, dir_item_info.size, stream);
            if err != 0 {
                println!("[ERROR] Failed to download image: 0x{:X}", err);
                EdsRelease(stream);
                // return Err(err);
            }
            // println!("[LOG] Image downloaded successfully.");

            // Завершаем скачивание
            let err = EdsDownloadComplete(directory_item);
            if err != 0 {
                println!("[ERROR] Failed to complete download: 0x{:X}", err);
                EdsRelease(stream);
                // return Err(err);
            }

            // Освобождаем поток
            if !stream.is_null() {
                EdsRelease(stream);
            }

            // Фиксируем, что фото создано
            if let Ok(mut photo_created) = camera.photo_created.lock() {
                *photo_created = true;
            } else {
                eprintln!("[ERROR] Failed to lock photo_created mutex.");
            }

            // let (look, cvar) = &*Arc::clone(&camera.photo_created);
            
            // let mut photo_created = look.lock().unwrap();
            // *photo_created = true;
            // cvar.notify_one();
            // println!("[LOG] Image downloaded and encoded to base64 successfully.");
            0
        }
    }

    fn start_live_view(&mut self) -> Result<(), u32> {
        unsafe {
            let mut device: u32 = 0;
            let err = EdsGetPropertyData(self.camera_ref, 0x00000500, 0, size_of::<u32>() as u32, &mut device as *mut _ as *mut c_void);
            
            if err != 0 {
                return Err(err);
            }
    
            if device & 2 != 0 {  // Проверяем бит 2, а не всё число
                return Ok(());
            }
    
            device |= 2; // Включить вывод живого просмотра
    
            let err = EdsSetPropertyData(self.camera_ref, 0x00000500, 0, size_of::<u32>() as u32, &mut device as *mut _ as *mut c_void);
            if err != 0 {
                return Err(err);
            }
    
            println!("Device value after enabling live view: {}", device);
        }
        
        self.is_live_view_started = true;
        println!("Live view started");
        Ok(())
    }
    

    fn stop_live_view(&mut self) -> Result<(), u32> {
            unsafe {
                let mut device: u32 = 0;
                let err = EdsGetPropertyData(
                    self.camera_ref,
                    0x00000500,
                    0,
                    size_of::<u32>() as u32,
                    &mut device as *mut _ as *mut c_void,
                );
                // println!("device: {}", device);
                // println!("err: {}", err);
                if err != 0 {
                    println!("Ошибка получения устройства вывода: {}", err);
                    return Err(err);
                }
    
                // Проверка, активно ли устройство вывода для живого просмотра
                if device & 2 != 0 {
                    // Отключаем вывод на компьютер (удаляем бит)
                    device &= !2;
    
                    // Устанавливаем новое значение для устройства вывода
                    let err = EdsSetPropertyData(
                        self.camera_ref,
                        0x00000500, // kEdsPropID_Evf_OutputDevice
                        0,
                        std::mem::size_of::<u32>() as u32,
                        &device as *const _ as *const c_void,
                    );
    
                    if err != 0 {
                        // println!("Failed to disable live view output device: {}", err);
                        return Err(err);
                    }
                }
    
                // self.is_live_view_started = false;
                // println!("Live View отключен.");
            }
            // Обновляем флаг состояния живого просмотра
           
            self.is_live_view_started = false;
            println!("Live view stopped.");
            Ok(())
    }

    // fn stop_live_view(&mut self) -> Result<(), u32> {
    //     if self.is_live_view_started {
    //         unsafe {
    //             let mut device: u32 = 0;
    //             let err = EdsGetPropertyData(
    //                 self.camera_ref,
    //                 0x00000500,
    //                 0,
    //                 size_of::<u32>() as u32,
    //                 &mut device as *mut _ as *mut c_void,
    //             );
    //             // println!("device: {}", device);
    //             // println!("err: {}", err);
    //             if err != 0 {
    //                 println!("Ошибка получения устройства вывода: {}", err);
    //                 return Err(err);
    //             }
    
    //             // Если Live View уже выключен — выходим
    //             if device & 2 == 0 {
    //                 println!("Live View уже выключен.");
    //                 return Ok(());
    //             }
    
    //             // Проверяем статус глубины резкости
    //             let mut depth_of_field_preview: u32 = 0;
    //             let err = EdsGetPropertyData(
    //                 self.camera_ref,
    //                 0x00000504,
    //                 0,
    //                 std::mem::size_of::<u32>() as u32,
    //                 &mut depth_of_field_preview as *mut _ as *mut c_void,
    //             );
    
    //             if err == 0 && depth_of_field_preview != 0 {
    //                 depth_of_field_preview = 0;
    //                 let err = EdsSetPropertyData(
    //                     self.camera_ref,
    //                     0x00000504,
    //                     0,
    //                     std::mem::size_of::<u32>() as u32,
    //                     &depth_of_field_preview as *const _ as *const c_void,
    //                 );
    
    //                 if err == 0 {
    //                     // Даем камере время обработать команду
    //                     thread::sleep(Duration::from_millis(500));
    //                 }
    //             }
    
    //             // Выключаем Live View
    //             device &= !2;
    //             let err = EdsSetPropertyData(
    //                 self.camera_ref,
    //                 0x00000500,
    //                 0,
    //                 std::mem::size_of::<u32>() as u32,
    //                 &device as *const _ as *const c_void,
    //             );
    
    //             if err != 0 {
    //                 if err == 0x00000081 {
    //                     println!("Ошибка: устройство занято (Device Busy)");
    //                 }
    //                 return Err(err);
    //             }
    
    //             // Проверяем и выключаем Evf_Mode (если включен)
    //             let mut evf_mode: u32 = 0;
    //             let err = EdsGetPropertyData(
    //                 self.camera_ref,
    //                 0x00000501,
    //                 0,
    //                 std::mem::size_of::<u32>() as u32,
    //                 &mut evf_mode as *mut _ as *mut c_void,
    //             );
    
    //             if err == 0 && evf_mode == 1 {
    //                 evf_mode = 0;
    //                 let err = EdsSetPropertyData(
    //                     self.camera_ref,
    //                     0x00000501,
    //                     0,
    //                     std::mem::size_of::<u32>() as u32,
    //                     &evf_mode as *const _ as *const c_void,
    //                 );
    
    //                 if err == 0x00000081 {
    //                     println!("Ошибка: устройство занято при отключении Evf_Mode");
    //                     return Err(err);
    //                 }
    //             }
    
    //             self.is_live_view_started = false;
    //             println!("Live View отключен.");
    //         }
    //         // Обновляем флаг состояния живого просмотра
    //         self.is_live_view_started = false;
    //         println!("Live view stopped.");
    //         Ok(())
    //     } else {
    //         println!("Live view is not active.");
    //         Ok(())
    //     }
    // }

    fn download_evf_image(&mut self) -> Result<String, String> {
        unsafe {
            let mut stream: *mut c_void = std::ptr::null_mut();
            let mut evf_image: *mut c_void = std::ptr::null_mut();
            // thread::sleep(Duratiosn::from_millis(200));
            // Создаем поток памяти для хранения изображения
            // println!("{}", stream as u32);
            let err = EdsCreateMemoryStream(0, &mut stream);
            if err != 0 {
                if err == 2 {
                    EdsRelease(stream);
                    EdsCloseSession(self.camera_ref); // Закрытие на случай повторного открытия
                    EdsRelease(self.camera_ref);
                    EdsTerminateSDK();
                }
                return Err(format!("Error creating memory stream: {}", err));
            }
            // Создаем ссылку на изображение live view (evf)
            let err = EdsCreateEvfImageRef(stream, &mut evf_image);
            if err != 0 {
                EdsRelease(stream);
                return Err(format!("Error creating EVF image reference: {}", err));
            }
            // Скачиваем изображение
            let err = EdsDownloadEvfImage(self.camera_ref, evf_image);
            // // println!("err: {}", err);
            if err != 0 {
                EdsRelease(evf_image);
                EdsRelease(stream);
                // // println!("Error downloading EVF image: {}", err);
                if err == 97 {
                    // let err = self::start_live_view();
                    // let _err= self.stop_live_view();
                    EdsCloseSession(self.camera_ref); // Закрытие на случай повторного открытия
                    EdsRelease(self.camera_ref);
                    EdsTerminateSDK();
                    if let Ok(camera) = Self::new() {
                        camera.lock().unwrap().start_live_view().unwrap();

                        return Ok("Live view started successfully".into());
                    }
                    // if err.is_err() {
                    //     return Err(format!("Error starting live view: {}", err.is_err()));
                    // }
                }
                return Err(format!("Error downloading EVF image: {}", err));
            }
            // Получаем длину данных в потоке
            let mut length: u64 = 0;
            let err = EdsGetLength(stream, &mut length);
            if err != 0 || length == 0 {
                EdsRelease(evf_image);
                EdsRelease(stream);
                return Err(format!("Error getting stream length: {}", err));
            }
            // Получаем указатель на данные
            let mut data_ptr: *mut u8 = std::ptr::null_mut();
            let err = EdsGetPointer(stream, &mut data_ptr);
            if err != 0 || data_ptr.is_null() {
                EdsRelease(evf_image);
                EdsRelease(stream);
                return Err(format!("Error getting pointer from stream: {}", err));
            }
            // Копируем данные в вектор
            let image_data = std::slice::from_raw_parts(data_ptr, length as usize).to_vec();
            // let image_data = Vec::from_raw_parts(data_ptr, length as usize, length as usize);
            // // println!("image_data: {:?}", image_data.len());
            let base64_data = BASE64_STANDARD.encode(&image_data);
            let result = format!("data:image/jpeg;base64,{}", base64_data);
            EdsRelease(evf_image);
            EdsRelease(stream);
            Ok(result)
        }
    }

}

impl Drop for Camera {
    fn drop(&mut self) {
        unsafe {
            EdsCloseSession(self.camera_ref);
            EdsRelease(self.camera_ref);
            EdsTerminateSDK();
        }
    }
}

#[tauri::command]
fn download_ev_image_command(state: tauri::State<'_, Arc<Mutex<Option<Arc<Mutex<Camera>>>>>>) -> Result<String, String> {
    let camera_lock = state.lock().unwrap();
    if let Some(camera) = &*camera_lock {
        camera.lock().unwrap().download_evf_image()
    } else {
        Err("Camera not initialized.".to_string())
    }
}

#[tauri::command]
fn initialize_camera(state: State<'_, Arc<Mutex<Option<Arc<Mutex<Camera>>>>>>,) -> Result<String, String> {
    let start_time = std::time::Instant::now();
    let timeout = std::time::Duration::from_secs(10);

    {
        let state_lock = state.lock().unwrap();
        if state_lock.is_some() {
            println!("Старая камера присуствует");
            return Ok("Камера подключена".into())
        }
    }

    loop {
        match Camera::new() {
            Ok(camera) => {
                let mut state_lock = state.lock().unwrap();
                *state_lock = Some(camera);
                return Ok("Camera initialized successfully".into());
            }
            Err(_) => {
                if start_time.elapsed() >= timeout {
                    return Err("Камера не подключена".into());
                }
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(500));
    }
}



// Tauri command for capturing a photo
#[tauri::command]
fn capture_photo_as(state: State<'_, Arc<Mutex<Option<Arc<Mutex<Camera>>>>>>, autofocus_enabled: bool) -> Result<String, String> {
    let state_lock = state.lock().unwrap();
    if let Some(camera) = &*state_lock {
        let mut camera_lock = camera.lock().unwrap();
        match camera_lock.capture_photo(autofocus_enabled) {
            Ok(_) => Ok("Photo captured successfully".into()),
            Err(err) => Err(format!("Failed to capture photo: Error code {}", err)),
        }
    } else {
        Err("Camera is not initialized".into())
    }
}

async fn save_captured_image(image_data: String) -> Result<String, String> {
    // println!("Saving captured image...");

    let current_date = Local::now().format("%Y-%m-%d").to_string();
    let base_path = tauri::api::path::picture_dir()
        .ok_or("Failed to resolve picture_dir")?;
    let project_path = PROJECT_PATH.lock().unwrap().clone().ok_or("Project path is not set.")?;
    
    let project_path_str = project_path.to_str().ok_or("Failed to convert path to string.")?;
    let parts: Vec<&str> = project_path_str.split("\\").collect();
    let project_name = parts.last().ok_or("Failed to extract project name.")?;
    let base_dir = base_path.join("Проекты").join(project_name);

    let date_dir = base_dir.join(&current_date);
    if !date_dir.exists() {
        fs::create_dir_all(&date_dir).map_err(|err| format!("Failed to create directory: {}", err))?;
    }

    let timestamp = Local::now().format("%H-%M-%S").to_string();
    let file_name = format!("photo_{}.jpg", timestamp);
    let file_path = date_dir.join(file_name);

    let decoded_image = BASE64_STANDARD
        .decode(&image_data)
        .map_err(|err| format!("Failed to decode image data: {}", err))?;
    let mut file = File::create(&file_path).map_err(|err| format!("Failed to create file: {}", err))?;
    file.write_all(&decoded_image)
        .map_err(|err| format!("Failed to write image to file: {}", err))?;

    // println!("Image saved to {}", file_path.display());


    Ok(file_path.to_str().unwrap_or_default().to_string())
}

#[tauri::command]
fn get_captured_image() -> Result<String, String> {
    // println!("Waiting for captured image...");

    // Путь к файлу captured_image.jpg
    // let file_path = PathBuf::from(env::current_dir().map_err(|err| err.to_string())?)
    //     .join("captured_image.jpg");

    let path = tauri::api::path::data_dir().unwrap();
    let file_path = path.join("captured_image.jpg");


    // Проверяем наличие файла каждые 1 секунду, максимум 30 секунд
    let max_attempts = 30;
    let mut attempts = 0;

    while !file_path.exists() {
        if attempts >= max_attempts {
            return Err("Image not found after 30 seconds.".to_string());
        }
        attempts += 1;
        // println!("Image not found, retrying... (Attempt {}/{})", attempts, max_attempts);
        thread::sleep(Duration::from_secs(1));
    }

    // Читаем файл, если он существует
    match fs::read(&file_path) {
        Ok(data) => {
            // println!("Image data read successfully");
            let base64_str = BASE64_STANDARD.encode(&data);
            if file_path.exists() {
                fs::remove_file(&file_path).map_err(|err| format!("Failed to delete file: {}", err))?;
                // println!("Remove file")
            } else {
                // println!("Image not found, skipping deletion.");
            }
            // let _ = save_captured_image(base64_str.clone());
            // Запускаем асинхронное сохранение в другом потоке
            let img_clone = base64_str.clone();
            tokio::spawn(async move {
                if let Err(_e) = save_captured_image(img_clone).await {
                    // eprintln!("Failed to save image: {}", e);
                }
            });
            
            Ok(base64_str)
        }
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[tauri::command]
fn start_live_view(state: State<'_, Arc<Mutex<Option<Arc<Mutex<Camera>>>>>>) -> Result<String, String> {
    let camera = state.lock().unwrap();
    if let Some(camera) = camera.as_ref() {
        camera.lock().unwrap().start_live_view()
            .map_err(|e| format!("Failed to start live view: Error code {}", e))?;
        Ok("Live view started successfully".into())
    } else {
        Err("Camera is not initialized".into())
    }
}


#[tauri::command]
fn stop_live_view(state: State<'_, Arc<Mutex<Option<Arc<Mutex<Camera>>>>>>) -> Result<String, String> {
    let camera = state.lock().unwrap();
    if let Some(camera) = camera.as_ref() {
        camera.lock().unwrap().stop_live_view()
            .map_err(|e| format!("Failed to start live view: Error code {}", e))?;
        Ok("Live view started successfully".into())
    } else {
        Err("Camera is not initialized".into())
    }
}

#[tauri::command]
fn end_camera(state: State<'_, Arc<Mutex<Option<Arc<Mutex<Camera>>>>>>) -> Result<String, String> {
    let mut camera = state.lock().unwrap();
    if let Some(camera) = camera.as_ref() {
        camera.lock().unwrap().stop_live_view()
            .map_err(|e| format!("Failed to start live view: Error code {}", e))?;
    }
    if let Some(camera) = camera.take() {
        drop(camera);
        Ok("Camera released successfully".into())
    } else {
        Err("Camera is not initialized".into())
    }
}


#[tokio::main]
async fn main() {
    let main_page = CustomMenuItem::new("main_page".to_string(), "Главная");
    let setting_page = CustomMenuItem::new("setting_page".to_string(), "Настройки");
    let hide_menu = CustomMenuItem::new("hide_menu".to_string(), "Скрыть меню");
    let enter_fullscreen = CustomMenuItem::new("enter_fullscreen".to_string(), "Войти в полноэкранный режим");
    let exit_fullscreen = CustomMenuItem::new("exit_fullscreen".to_string(), "Выйти из полноэкранного режима");
    
    let menu = Menu::new()
        .add_item(hide_menu.clone())
        .add_item(enter_fullscreen.clone())
        .add_item(exit_fullscreen.clone())
        .add_item(main_page.clone())
        .add_item(setting_page.clone());

    // Используем Arc и Mutex для управления видимостью меню
    let menu_visible = Arc::new(Mutex::new(true));

    

    tauri::Builder::default()
        .menu(menu)
        .on_menu_event({
            let menu_visible = menu_visible.clone();
            move |event| {
                let window = event.window();
                match event.menu_item_id() {
                    "main_page" => {
                        event.window().emit("navigate-to-page", "main_page").unwrap();
                    }
                    "setting_page" => {
                        event.window().emit("navigate-to-page", "setting_page").unwrap();
                    }
                    "hide_menu" => {
                        let mut visible = menu_visible.lock().unwrap();
                        *visible = false;
                        window.menu_handle().hide().unwrap();
                    }
                    "enter_fullscreen" => {
                        window.set_fullscreen(true).unwrap();
                    }
                    "exit_fullscreen" => {
                        window.set_fullscreen(false).unwrap();
                    }
                    _ => {}
                }
            }
        })
        .setup({
            move |app| {
                let handle = app.handle();
                // let handle_clone = handle.clone();
                let window = handle.get_window("main").unwrap();
                let menu_visible = menu_visible.clone();
                // // Обработчик событий клавиатуры  
                // tokio::spawn(async {
                //     let app = Router::new().route("/httppay", post(handle_post));
                //     let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
                //     println!("Fake HTTPPay сервер запущен на http://{}", addr);
                
                //     if let Err(e) = hyper::Server::bind(&addr).serve(app.into_make_service()).await {
                //         eprintln!("Ошибка сервера: {}", e);
                //     }
                // });

                thread::spawn(move || {
                    let mut last_check = Instant::now();
                    loop {
                        if last_check.elapsed() >= Duration::from_millis(100) {
                            let keys = DeviceState::new().get_keys();
                            let mut visible = menu_visible.lock().unwrap(); // Захватываем блокировку
                            if keys.contains(&Keycode::LControl) && keys.contains(&Keycode::LShift) && keys.contains(&Keycode::H) {
                                // Меняем видимость меню на основе нажатых клавиш
                                if *visible {
                                    window.menu_handle().hide().unwrap();
                                    *visible = false;
                                } else {
                                    window.menu_handle().show().unwrap();
                                    *visible = true;
                                }
                            }
                            if keys.contains(&Keycode::LControl) && keys.contains(&Keycode::LShift) && keys.contains(&Keycode::F) {
                                // Переключаем полноэкранный режим
                                let is_fullscreen = window.is_fullscreen().unwrap_or(false);
                                window.set_fullscreen(!is_fullscreen).unwrap();
                            }
                            last_check = Instant::now();
                            drop(visible); // Освобождаем блокировку как можно скорее
                        }
                        thread::sleep(Duration::from_millis(50));
                    }
                });

                // Инициализация директорий

                Ok(())
            }
        })
        .invoke_handler(tauri::generate_handler![print_image, get_work_hours, set_work_hours, save_image, save_canvas_data, save_canvas_image, load_all_canvas_data, delete_canvas_image_and_data, load_all_canvas_images,
            load_available_canvas_data,
            print_image_use_path,
            initialize_camera,
            capture_photo_as,
            start_live_view,
            download_ev_image_command,
            get_captured_image,
            stop_live_view,
            get_printers_info, get_projects, select_project, delete_project, load_project_name,
            saving_printer_data,
            update_selected_printer,
            end_camera, save_settings,
            printer_information,
            printer_settings,
            printer_status,
            delete_image,
            get_image_path,
            read_settings,
            get_image_paths,
            verify_license,
            check_license, 
            save_canvas_template,
            get_saved_canvas_template_paths,
            load_canvas_template, 
            save_part_templates
            ])
        .manage(Arc::new(Mutex::new(None::<Arc<Mutex<Camera>>>)))
        .manage(PrinterState::default())
        .manage(LicenseState { license: Mutex::new(None) })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
#[tauri::command]
fn print_image(image_data: String, state: State<PrinterState>) -> Result<(), String> {
    println!("Printing image...");
    let decoded_data = BASE64_STANDARD.decode(image_data).map_err(|e| e.to_string())?;

    let base_path = tauri::api::path::picture_dir().ok_or("Failed to resolve picture_dir")?;
    let project_path = PROJECT_PATH.lock().unwrap().clone().ok_or("Project path is not set.")?;
    let project_name = project_path.file_name().ok_or("Failed to extract project name.")?.to_str().unwrap();
    let base_dir = base_path.join("Проекты").join(project_name);

    if !base_dir.exists() {
        std::fs::create_dir_all(&base_dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let timestamp = Local::now().format("%H-%M-%S").to_string();
    let file_name = format!("photo_{}.jpg", timestamp);
    let file_path = base_dir.join(file_name);

    let mut file = File::create(&file_path).map_err(|e| e.to_string())?;
    file.write_all(&decoded_data).map_err(|e| e.to_string())?;
    drop(file);

    let state_printer = state.selected_printer.lock().unwrap();
    let printer_name = state_printer.as_ref().map(|printer| printer.name.clone()).unwrap_or_default();
    let file_path_str = file_path.display().to_string();
    let escaped_file_path = format!("\"{}\"", file_path_str.replace("\\", "\\\\"));

    thread::sleep(Duration::from_millis(100));

    let print_function = r#"
function Print-Image {
    param(
        [string]$PrinterName,
        [string]$FilePath,
        [int]$Scale,
        [string]$PrintJobName,
        [string]$PrintQuality
    )
    Add-Type -AssemblyName System.Drawing
    $printDocument = New-Object System.Drawing.Printing.PrintDocument
    $printDocument.PrinterSettings.PrinterName = $PrinterName
    $printDocument.OriginAtMargins = $false
    $image = [System.Drawing.Image]::FromFile($FilePath)

    # Определяем ориентацию бумаги
    if ($image.Width -gt $image.Height) {
        $printDocument.DefaultPageSettings.Landscape = $true
    } else {
        $printDocument.DefaultPageSettings.Landscape = $false
    }

    # Обработчик печати
    $printDocument.add_PrintPage({
        param($sender, $e)
        $img = [System.Drawing.Image]::FromFile($FilePath)  # Загружаем изображение в обработчике

        $e.PageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)
        # Определяем размеры бумаги
        $pageWidth = $e.PageBounds.Width
        $pageHeight = $e.PageBounds.Height
        
        # Определяем масштаб с учетом ориентации
        $scaleFactor = [Math]::Min(($pageWidth / $img.Width), ($pageHeight / $img.Height)) * ($Scale / 100)

        $scaledWidth = $img.Width * $scaleFactor
        $scaledHeight = $img.Height * $scaleFactor
        
        # Центрируем изображение
        $x = $e.MarginBounds.Left + ($pageWidth - $scaledWidth) / 2
        $y = $e.MarginBounds.Top + ($pageHeight - $scaledHeight) / 2

        $e.Graphics.DrawImage($img, 0, 0, $scaledWidth + 1, $scaledHeight)
        $img.Dispose()  # Освобождаем ресурс после использования
    })

    # Качество печати

    $printDocument.PrinterSettings.DefaultPageSettings.PrinterResolution.Kind = [System.Drawing.Printing.PrinterResolutionKind]::High
    $printDocument.PrintController = New-Object System.Drawing.Printing.StandardPrintController

    $printDocument.Print()
}
    "#;

    let command = format!(
        r#"
{}
Print-Image -PrinterName "{}" -FilePath {} -Scale 100 -PaperSize "6x4-Split (6x2 2 prints)" -PrintJobName "ImagePrintJob" -PrintQuality "High"
        "#,
        print_function,
        printer_name,
        escaped_file_path
    );

    let output = Command::new("powershell")
        .args(&["-Command", &command])
        .creation_flags(CREATE_NO_WINDOW) // <-- Отключает всплывающее окно PowerShell
        .stdout(Stdio::null()) // Отключает вывод в консоль
        .stderr(Stdio::null()) // Отключает ошибки в консоль
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}


// #[tauri::command]
// fn save_image(, image_data: String, file_name: String) -> Result<(), String> {

//     let decoded_data = BASE64_STANDARD.decode(image_data).map_err(|e| e.to_string())?;
//     // println!("Size of decoded image data: {} bytes", decoded_data.len());
//     // Установите путь для сохранения файла
//     let base_path = PROJECT_PATH.lock().unwrap()
//     .clone()
//     .ok_or("Project path is not set. Call update_project_path first.")?;

//     let file_path = base_path.join("database").join("background").join(file_name);
//     let mut file = File::create(file_path.clone()).map_err(|e| e.to_string())?;

//     file.write_all(&decoded_data).map_err(|e| e.to_string())?;
//     Ok(())
// }



//-------------------------------------------------Template Editor-------------------------------------------------------------------------------------
#[tauri::command]
fn save_canvas_data(canvas_id: String, data: String, available: bool) -> Result<(), String> {
    // Получаем путь к папке приложения для хранения данных
    let base_path = PROJECT_PATH.lock().unwrap()
        .clone()
        .ok_or("Project path is not set. Call update_project_path first.")?;

    // Создаем путь для сохранения данных шаблона в папке 'template'
    let template_dir;
    let other_template_dir;

    if available {
        template_dir = base_path.join("template/available");
        other_template_dir = base_path.join("template/not_available");
    } else {
        template_dir = base_path.join("template/not_available");
        other_template_dir = base_path.join("template/available");
    }

    // Убедимся, что директория существует, и создадим её при необходимости
    if !template_dir.exists() {
        fs::create_dir_all(&template_dir).map_err(|e| e.to_string())?;
    }

    // Проверка наличия файла с таким же именем в другой папке и удаление его
    let other_file_path = other_template_dir.join(format!("canvas_{}.json", canvas_id));
    if other_file_path.exists() {
        fs::remove_file(&other_file_path).map_err(|e| format!("Ошибка при удалении файла: {}", e))?;
    }

    // Создаем полный путь для файла JSON с использованием canvas_id
    let file_path = template_dir.join(format!("canvas_{}.json", canvas_id));

    // Сохраняем данные холста в файл
    fs::write(&file_path, data).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn save_canvas_image(canvas_id: String, base64_image: String, available: bool) -> Result<(), String> {
    // Получаем путь к папке приложения для хранения данных
    let base_path = PROJECT_PATH.lock().unwrap()
        .clone()
        .ok_or("Project path is not set. Call update_project_path first.")?;

    // Создаем путь для сохранения изображений холста в папке 'images'
    let image_dir;
    let other_image_dir;

    if available {
        image_dir = base_path.join("template/available");
        other_image_dir = base_path.join("template/not_available");
    } else {
        image_dir = base_path.join("template/not_available");
        other_image_dir = base_path.join("template/available");
    }

    // Убедимся, что директория существует, и создадим её при необходимости
    if !image_dir.exists() {
        fs::create_dir_all(&image_dir).map_err(|e| e.to_string())?;
    }

    // Проверка наличия файла с таким же именем в другой папке и удаление его
    let other_image_path = other_image_dir.join(format!("canvas_{}.png", canvas_id));
    if other_image_path.exists() {
        fs::remove_file(&other_image_path).map_err(|e| format!("Ошибка при удалении файла: {}", e))?;
    }

    // Создаем полный путь для файла изображения с использованием canvas_id
    let image_path = image_dir.join(format!("canvas_{}.png", canvas_id));

    // Декодируем base64 строку изображения в байты
    let image_data = BASE64_STANDARD.decode(&base64_image).map_err(|e| format!("Ошибка декодирования изображения: {}", e))?;

    // Сохраняем изображение в файл
    fs::write(&image_path, image_data).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn delete_canvas_image_and_data(canvas_id: String, available: bool) -> Result<(), String> {
    // Получаем путь к папке приложения для хранения данных
    let base_path = PROJECT_PATH.lock().unwrap()
        .clone()
        .ok_or("Project path is not set. Call update_project_path first.")?;

    // Создаем путь для сохранения данных шаблона в папке 'template'
    let template_dir;
    let image_dir;

    if available {
        template_dir = base_path.join("template/available");
        image_dir = base_path.join("template/available");
    } else {
        template_dir = base_path.join("template/not_available");
        image_dir = base_path.join("template/not_available");
    }

    // Создаем полный путь для файла JSON с использованием canvas_id
    let file_path = template_dir.join(format!("canvas_{}.json", canvas_id));
    let image_path = image_dir.join(format!("canvas_{}.png", canvas_id));

    // Удаляем файлы
    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    }

    if image_path.exists() {
        fs::remove_file(&image_path).map_err(|e| format!("Ошибка при удалении файла: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
fn load_all_canvas_data() -> Result<Vec<Value>, String> {
    let base_path = PROJECT_PATH.lock().unwrap()
        .clone()
        .ok_or("Project path is not set. Call update_project_path first.")?;

    let template_dir_not_available = base_path.join("template/not_available");
    let template_dir_available = base_path.join("template/available");

    // Получаем все JSON файлы в директории
    let mut canvas_data = Vec::new();

    if template_dir_not_available.exists() {
        if let Ok(entries) = fs::read_dir(&template_dir_not_available) {
            for entry in entries.filter_map(Result::ok) {
                if let Some(extension) = entry.path().extension() {
                    if extension == "json" {
                        // Читаем файл и добавляем его содержимое в массив
                        let data = fs::read_to_string(entry.path())
                            .map_err(|e| e.to_string())?;
                        let json_value: Value = serde_json::from_str(&data)
                            .map_err(|e| e.to_string())?;
                        canvas_data.push(json_value);
                    }
                }
            }
        }
    }

    if template_dir_available.exists() {
        if let Ok(entries) = fs::read_dir(&template_dir_available) {
            for entry in entries.filter_map(Result::ok) {
                if let Some(extension) = entry.path().extension() {
                    if extension == "json" {
                        // Читаем файл и добавляем его содержимое в массив
                        let data = fs::read_to_string(entry.path())
                            .map_err(|e| e.to_string())?;
                        let json_value: Value = serde_json::from_str(&data)
                            .map_err(|e| e.to_string())?;
                        canvas_data.push(json_value);
                    }
                }
            }
        }
    }

    if canvas_data.is_empty() {
        return Ok(vec![]);
    }

    Ok(canvas_data)

}

#[tauri::command]
fn load_all_canvas_images() -> Result<Vec<String>, String> {
    let base_path = PROJECT_PATH.lock().unwrap()
        .clone()
        .ok_or("Project path is not set. Call update_project_path first.")?;    

    let image_dir_available = base_path.join("template/available");

    // Вектор для хранения изображений в формате Base64
    let mut canvas_images = Vec::new();

    // Обрабатываем папку "available"
    if image_dir_available.exists() {
        if let Ok(entries) = fs::read_dir(&image_dir_available) {
            for entry in entries.filter_map(Result::ok) {
                if let Some(extension) = entry.path().extension() {
                    if extension == "png" || extension == "jpg" || extension == "jpeg" {
                        // Читаем изображение как бинарные данные
                        let image_data = fs::read(entry.path())
                            .map_err(|e| e.to_string())?;
                        // Кодируем в base64
                        let base64_image = BASE64_STANDARD.encode(&image_data);
                        canvas_images.push(base64_image);
                    }
                }
            }
        }
    }

    Ok(canvas_images)
}

#[tauri::command]
fn load_available_canvas_data() -> Result<Vec<Value>, String> {
    let base_path = PROJECT_PATH.lock().unwrap()
        .clone()
        .ok_or("Project path is not set. Call update_project_path first.")?;

    let template_dir_available = base_path.join("template/available");

    // Получаем все JSON файлы в директории
    let mut canvas_data = Vec::new();

    if template_dir_available.exists() {
        if let Ok(entries) = fs::read_dir(&template_dir_available) {
            for entry in entries.filter_map(Result::ok) {
                if let Some(extension) = entry.path().extension() {
                    if extension == "json" {
                        // Читаем файл и добавляем его содержимое в массив
                        let data = fs::read_to_string(entry.path())
                            .map_err(|e| e.to_string())?;
                        let json_value: Value = serde_json::from_str(&data)
                            .map_err(|e| e.to_string())?;
                        canvas_data.push(json_value);
                    }
                }
            }
        }
    }

    Ok(canvas_data)
}


#[tauri::command]
fn print_image_use_path(image_path: String, state: State<PrinterState>) -> Result<(), String> {

    let state_printer = state.selected_printer.lock().unwrap();
    let printer_name = state_printer.as_ref().map(|printer| printer.name.clone()).unwrap_or_default();

    let file_path_str = image_path.to_string();
    let escaped_file_path = format!("\"{}\"", file_path_str.replace("\\", "\\\\"));
    // println!("Escaped file path: {}", escaped_file_path);

    thread::sleep(Duration::from_millis(100));

    let print_function = r#"
function Print-Image {
    param(
        [string]$PrinterName,
        [string]$FilePath,
        [int]$Scale,
        [string]$PrintJobName,
        [string]$PrintQuality
    )
    Add-Type -AssemblyName System.Drawing
    $printDocument = New-Object System.Drawing.Printing.PrintDocument
    $printDocument.PrinterSettings.PrinterName = $PrinterName
    $printDocument.OriginAtMargins = $false
    $image = [System.Drawing.Image]::FromFile($FilePath)

    # Определяем ориентацию бумаги
    if ($image.Width -gt $image.Height) {
        $printDocument.DefaultPageSettings.Landscape = $true
    } else {
        $printDocument.DefaultPageSettings.Landscape = $false
    }

    # Обработчик печати
    $printDocument.add_PrintPage({
        param($sender, $e)
        $img = [System.Drawing.Image]::FromFile($FilePath)  # Загружаем изображение в обработчике

        $e.PageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)
        # Определяем размеры бумаги
        $pageWidth = $e.PageBounds.Width
        $pageHeight = $e.PageBounds.Height
        
        # Определяем масштаб с учетом ориентации
        $scaleFactor = [Math]::Min(($pageWidth / $img.Width), ($pageHeight / $img.Height)) * ($Scale / 100)

        $scaledWidth = $img.Width * $scaleFactor
        $scaledHeight = $img.Height * $scaleFactor
        
        # Центрируем изображение
        $x = $e.MarginBounds.Left + ($pageWidth - $scaledWidth) / 2
        $y = $e.MarginBounds.Top + ($pageHeight - $scaledHeight) / 2

        $e.Graphics.DrawImage($img, 0, 0, $scaledWidth + 1, $scaledHeight)
        $img.Dispose()  # Освобождаем ресурс после использования
    })

    # Качество печати
    $printDocument.PrinterSettings.DefaultPageSettings.PrinterResolution.Kind = [System.Drawing.Printing.PrinterResolutionKind]::High
    $printDocument.PrintController = New-Object System.Drawing.Printing.StandardPrintController
    $printDocument.Print()
}
    "#;

    let command = format!(
        r#"
{}
Print-Image -PrinterName "{}" -FilePath {} -Scale 100 -PaperSize "6x4-Split (6x2 2 prints)" -PrintJobName "ImagePrintJob" -PrintQuality "High"
        "#,
        print_function,
        printer_name,
        escaped_file_path
    );

    // Передача функции в PowerShell
    let output = Command::new("powershell")
        .args(&["-Command", &command])
        .creation_flags(CREATE_NO_WINDOW) // <-- Отключает всплывающее окно PowerShell
        .stdout(Stdio::null()) // Отключает вывод в консоль
        .stderr(Stdio::null()) // Отключает ошибки в консоль
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

























use uuid::Uuid;


#[tauri::command]
fn save_canvas_template(app: AppHandle, data: String, base64_image: String) -> Result<(), String> {
    let base_path = app
        .path_resolver()
        .app_local_data_dir()
        .ok_or("Не удалось получить путь к папке данных приложения")?
        .join("TemplateOptions");

    fs::create_dir_all(&base_path).map_err(|e| format!("Не удалось создать папку: {}", e))?;

    let id = Uuid::new_v4();

    let image_path = base_path.join(format!("canvas_{}.png", id));
    let file_path = base_path.join(format!("canvas_{}.json", id));

    let image_data = BASE64_STANDARD
        .decode(&base64_image)
        .map_err(|e| format!("Ошибка декодирования изображения: {}", e))?;

    fs::write(&image_path, image_data).map_err(|e| e.to_string())?;
    fs::write(&file_path, data).map_err(|e| e.to_string())?;

    Ok(())
}



#[tauri::command]
fn get_saved_canvas_template_paths(app: AppHandle) -> Result<Vec<TemplatePaths>, String> {
    let base_path = app
        .path_resolver()
        .app_local_data_dir()
        .ok_or("Не удалось получить путь к папке данных приложения")?
        .join("TemplateOptions");

    let entries = fs::read_dir(&base_path).map_err(|e| e.to_string())?;

    let mut json_files: HashMap<String, PathBuf> = HashMap::new();
    let mut other_files: HashMap<String, PathBuf> = HashMap::new();

    for entry in entries.filter_map(Result::ok) {
        let path = entry.path();
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("").to_string();

        match ext {
            "json" => {
                json_files.insert(stem.clone(), path);
            }
            _ => {
                other_files.insert(stem.clone(), path);
            }
        }
    }
    // println!("json_files: {:?}", json_files.keys());
    // println!("other_files: {:?}", other_files);

    let mut result = Vec::new();
    for name in json_files.keys() {
        if let (Some(json), Some(image)) = (json_files.get_key_value(name), other_files.get(name)) {
            result.push(TemplatePaths {
                json: json.0.to_string().to_string(),
                image: image.to_string_lossy().to_string(),
            });
        }
    }

    Ok(result)
}


#[tauri::command]
fn load_canvas_template(app: AppHandle, path: String) -> Result<String, String> {
    let base_path = app
        .path_resolver()
        .app_local_data_dir()
        .ok_or("Не удалось получить путь к папке данных приложения")?
        .join("TemplateOptions")
        .join(path);

    fs::read_to_string(base_path).map_err(|e| e.to_string())
}



#[tauri::command]
fn save_part_templates(app: AppHandle, data: String, canvas_id: String, object_id: String) -> Result<String, String> {
    let base_path = app
        .path_resolver()
        .app_local_data_dir()
        .ok_or("Не удалось получить путь к папке данных приложения")?
        .join(format!("PartTemplates/canvas_{}", canvas_id));

    fs::create_dir_all(&base_path).map_err(|e| format!("Не удалось создать папку: {}", e))?;

    // Убираем префикс, например, data:image/png;base64,
    let (mime_type, base64_data_cleaned) = if let Some(pos) = data.find("base64,") {
        let mime_type = &data[..pos];  // MIME тип, например "data:image/png;"
        let data_cleaned = &data[pos + 7..];   // сами данные
        (mime_type, data_cleaned)
    } else {
        return Err("Некорректные данные base64".into());
    };

    // Определяем расширение файла на основе MIME типа
    let mime_str = mime_type.trim_start_matches("data:").trim_end_matches(';');
    let mime_guess = MimeGuess::from_ext(mime_str);
    let ext = mime_guess
        .first_raw()
        .unwrap_or("png"); // fallback
    println!("MIME type: {}, Extension: {}", mime_str, ext);

    // Генерация пути с правильным расширением
    let file_path = base_path.join(format!("image_{}.{}", object_id, ext));

    println!("File path: {:?}", file_path);
    // Декодируем base64 данные
    let decoded_data = BASE64_STANDARD.decode(base64_data_cleaned)
        .map_err(|e| format!("Ошибка декодирования base64: {}", e))?;

    fs::write(&file_path, decoded_data)
        .map_err(|e| format!("Не удалось записать файл: {}", e))?;

    Ok(file_path.to_str().unwrap_or_default().to_string())
}
