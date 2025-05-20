use crate::fs_utils::{writing_to_json_file, reading_from_json_file};
use crate::globals::ChromokeyInfo;


#[tauri::command]
pub fn save_settings(color: String, counter: u32, status: bool, visible: bool, payment: bool) -> Result<(), String> {
    let chromokey_data: ChromokeyInfo = ChromokeyInfo {
        color: color,
        counter_capture_photo: counter,
        is_enabled: status,
        printer_visible: visible,
        payment_enabled: payment
    };

    writing_to_json_file("settings/chromokey.json", &chromokey_data).map_err(|e| e.to_string())?;

    Ok(())
}


#[tauri::command]
pub fn read_settings() -> Result<ChromokeyInfo, String> {
    let chromokey_data: ChromokeyInfo = reading_from_json_file("settings/chromokey.json").map_err(|e| e.to_string())?;
    Ok(chromokey_data)
}