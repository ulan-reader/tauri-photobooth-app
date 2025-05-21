use serde::{Deserialize, Serialize};
use tauri::Manager;
use crate::globals::PROJECT_PATH;
use std::path::PathBuf;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE, CONTENT_LENGTH};
use tauri::command;

const FAKE_SERVER_URL: &str = "http://192.168.1.1/httppay";

#[derive(Serialize)]
struct HttpPayRequest<'a> {
    act: &'a str,
}

#[derive(Deserialize, Debug)]
struct ServerResponse {
    error: String,
}

#[derive(Serialize, Clone)]
struct RequestPayload<'a> {
    act: &'a str,
    amount: f32,
    item: u16,
    name_kz: &'a str,
    name_ru: &'a str,
}

#[derive(Deserialize, Debug)]
struct HttpPayStatus {
    error: String,
    status: Option<String>,
}

#[derive(Deserialize)]
pub struct StartSessionPayload {
    pub amount: f32,
    pub item: u16,
    pub name_kz: String,
    pub name_ru: String,
}

#[derive(Debug, Deserialize)]
struct PaymentResponse {
    result: String,
}


#[derive(Serialize)]
struct OptionRequest {
    act: &'static str,
}

#[derive(Debug, Deserialize)]
struct OptionResponse {
    error: String,
    #[serde(default)]  // Позволяет пропустить поле
    guid: Option<String>,  // Теперь optional
    #[serde(default)]
    custom: Option<String>,
}

#[tauri::command]
pub async fn start_payment_session(payload: StartSessionPayload) -> Result<String, String> {
    
    // Валидация данных
    if payload.amount < 0.01 || payload.amount > 9999.99 {
        println!("Неверная сумма: {}", payload.amount);
        return Err("Некорректная сумма".into());
    }
    
    if payload.name_kz.len() > 31 || payload.name_ru.len() > 31 {
        println!("Слишком длинное название");
        return Err("Название слишком длинное".into());
    }

    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10)) // Таймаут 10 секунд
        .build() {
            Ok(c) => c,
            Err(e) => {
                println!("Ошибка создания клиента: {}", e);
                return Err("Внутренняя ошибка сервера".into());
            }
        };

    let body = RequestPayload {
        act: "request",
        amount: payload.amount,
        item: payload.item,
        name_kz: &payload.name_kz,
        name_ru: &payload.name_ru,
    };

    let json_body = match serde_json::to_string(&body) {
        Ok(j) => j,
        Err(e) => {
            println!("Ошибка сериализации: {}", e);
            return Err("Ошибка формирования запроса".into());
        }
    };

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(CONTENT_LENGTH, HeaderValue::from_str(&json_body.len().to_string()).unwrap());

    let res = match client
        .post(FAKE_SERVER_URL)
        .json(&body)
        .send()
        .await {
            Ok(r) => r,
            Err(e) => {
                println!("Ошибка отправки запроса: {}", e);
                return Err("Ошибка соединения".into());
            }
        };

    if !res.status().is_success() {
        return Err(format!("HTTP ошибка: {}", res.status()));
    }
        
    println!("Получен ответ, статус: {}", res.status());

    let response_json: ServerResponse = match res.json().await {
        Ok(json) => json,
        Err(e) => {
            println!("Ошибка при чтении JSON: {}", e);
            return Err("Ошибка обработки ответа".into());
        }
    };

    println!("Текст ответа: {}", response_json.error);

    Ok(response_json.error)
}

#[tauri::command]
pub async fn cancel_payment_session() -> Result<String, String> {
    let client = reqwest::Client::new();

    let request_body = HttpPayRequest { act: "cancel" };
    let json_body = serde_json::to_string(&request_body)
        .map_err(|e| format!("Ошибка сериализации: {}", e))?;

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(CONTENT_LENGTH, HeaderValue::from_str(&json_body.len().to_string()).unwrap());

    let res = client
        .post(FAKE_SERVER_URL)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Cancel error: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("HTTP ошибка: {}", res.status()));
    }
    
    let response_json: ServerResponse = match res.json().await {
        Ok(json) => json,
        Err(e) => {
            println!("Ошибка при чтении JSON: {}", e);
            return Err("Ошибка обработки ответа".into());
        }
    };

    println!("Cancel response: {}", response_json.error);

    Ok(response_json.error)
}

#[tauri::command]
pub async fn complete_payment_session() -> Result<String, String> {
    let client = reqwest::Client::new();

    let request_body = HttpPayRequest { act: "complete" };
    let json_body = serde_json::to_string(&request_body)
        .map_err(|e| format!("Ошибка сериализации: {}", e))?;

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(CONTENT_LENGTH, HeaderValue::from_str(&json_body.len().to_string()).unwrap());

    let res = client
        .post(FAKE_SERVER_URL)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Complete error: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("HTTP ошибка: {}", res.status()));
    }
        
    let response_json: ServerResponse = match res.json().await {
        Ok(json) => json,
        Err(e) => {
            println!("Ошибка при чтении JSON: {}", e);
            return Err("Ошибка обработки ответа".into());
        }
    };

    println!("Cancel response: {}", response_json.error);

    Ok(response_json.error)
}

#[tauri::command]
pub async fn get_payment_status() -> Result<String, String> {
    let client = reqwest::Client::new();

    let request_body = HttpPayRequest { act: "status" };
    let json_body = serde_json::to_string(&request_body)
        .map_err(|e| format!("Ошибка сериализации: {}", e))?;

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(CONTENT_LENGTH, HeaderValue::from_str(&json_body.len().to_string()).unwrap());

    let res = client
        .post(FAKE_SERVER_URL)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Status error: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("HTTP ошибка: {}", res.status()));
    }
    
    let data: HttpPayStatus = res.json().await.map_err(|e| format!("Invalid JSON: {}", e))?;
    // println!("{}", data);
    Ok(data.status.unwrap_or("unknown".into()))
}

#[tauri::command]
pub async fn get_device_options(ip: String) -> Result<(String, String), String> {
    let client = reqwest::Client::new();

    // Подготавливаем запрос
    let request_body = OptionRequest { act: "option" };
    let json_body = serde_json::to_string(&request_body)
        .map_err(|e| format!("Ошибка сериализации: {}", e))?;

    // Настраиваем заголовки
    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(CONTENT_LENGTH, HeaderValue::from_str(&json_body.len().to_string()).unwrap());

    // Формируем URL
    let url = format!("http://{}/httppay", ip);
    println!("Trying to take options!");

    // Отправляем запрос
    let res = client
        .post(&url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Ошибка запроса: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("HTTP ошибка: {}", res.status()));
    }

    let raw_response = res.text()
        .await
        .map_err(|e| format!("Ошибка чтения ответа: {}", e))?;

    println!("Raw server response: {}", raw_response);
    // Обрабатываем ответ
    let data: OptionResponse = serde_json::from_str(&raw_response)
        .map_err(|e| format!("Ошибка парсинга JSON: {}", e))?;

    let guid = data.guid.unwrap_or_else(|| "default_guid".to_string());
    let custom = data.custom.unwrap_or_else(|| "default_custom".to_string());   

    Ok((guid, custom))
}

#[tauri::command]
pub async fn take_item_information_path() -> Result<String, String> {
    let base_path = PROJECT_PATH
        .lock()
        .unwrap()
        .clone()
        .ok_or("Project path is not set. Call update_project_path first.")?;

    let script_dir = base_path.join("time");

    Ok(script_dir.to_string_lossy().into())
}