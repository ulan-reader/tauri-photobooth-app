use serde::{Deserialize, Serialize};
use tauri::Manager;
use crate::globals::PROJECT_PATH;
use std::path::PathBuf;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE, CONTENT_LENGTH};

const FAKE_SERVER_URL: &str = "http://192.168.1.2:80/httppay";

#[derive(Serialize)]
struct HttpPayRequest<'a> {
    act: &'a str,
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

#[tauri::command]
pub async fn start_payment_session(payload: StartSessionPayload) -> Result<(), String> {
    let client = reqwest::Client::new();

    let body = RequestPayload {
        act: "request",
        amount: payload.amount,
        item: payload.item,
        name_kz: &payload.name_kz,
        name_ru: &payload.name_ru,
    };

    let json_body = serde_json::to_string(&body)
        .map_err(|e| format!("Ошибка сериализации: {}", e))?;

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(CONTENT_LENGTH, HeaderValue::from_str(&json_body.len().to_string()).unwrap());
    println!("Start session response",);

    let res = client
        .post(FAKE_SERVER_URL)
        .headers(headers)
        .body(json_body)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    let text = res.text().await.unwrap_or_else(|_| "Нет ответа".into());
    println!("Start session response: {}", text);
    Ok(())
}

#[tauri::command]
pub async fn cancel_payment_session() -> Result<(), String> {
    let client = reqwest::Client::new();

    let request_body = HttpPayRequest { act: "cancel" };
    let json_body = serde_json::to_string(&request_body)
        .map_err(|e| format!("Ошибка сериализации: {}", e))?;

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(CONTENT_LENGTH, HeaderValue::from_str(&json_body.len().to_string()).unwrap());

    let res = client
        .post(FAKE_SERVER_URL)
        .headers(headers)
        .body(json_body)
        .send()
        .await
        .map_err(|e| format!("Cancel error: {}", e))?;

    let text = res.text().await.unwrap_or_else(|_| "Нет ответа".into());
    println!("Cancel response: {}", text);

    Ok(())
}

#[tauri::command]
pub async fn complete_payment_session() -> Result<(), String> {
    let client = reqwest::Client::new();

    let request_body = HttpPayRequest { act: "complete" };
    let json_body = serde_json::to_string(&request_body)
        .map_err(|e| format!("Ошибка сериализации: {}", e))?;

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(CONTENT_LENGTH, HeaderValue::from_str(&json_body.len().to_string()).unwrap());

    let res = client
        .post(FAKE_SERVER_URL)
        .headers(headers)
        .body(json_body)
        .send()
        .await
        .map_err(|e| format!("Complete error: {}", e))?;

    let text = res.text().await.unwrap_or_else(|_| "Нет ответа".into());
    println!("Complete response: {}", text);

    Ok(())
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
        .headers(headers)
        .body(json_body)
        .send()
        .await
        .map_err(|e| format!("Status error: {}", e))?;

    let data: HttpPayStatus = res.json().await.map_err(|e| format!("Invalid JSON: {}", e))?;

    Ok(data.status.unwrap_or("unknown".into()))
}

#[tauri::command]
pub async fn take_options() -> Result<String, String> {
    let client = reqwest::Client::new();

    let request_body = HttpPayRequest { act: "option" };
    let json_body = serde_json::to_string(&request_body)
        .map_err(|e| format!("Ошибка сериализации: {}", e))?;

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(CONTENT_LENGTH, HeaderValue::from_str(&json_body.len().to_string()).unwrap());

    let res = client
        .post(FAKE_SERVER_URL)
        .headers(headers)
        .body(json_body)
        .send()
        .await
        .map_err(|e| format!("Ошибка отправки запроса: {}", e))?;

    let text = res.text().await.unwrap_or_else(|_| "Нет ответа".into());
    println!("{}", text);
    Ok(text)
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

async fn send_simple_act(needed_act: &'static str) -> Result<(), String> {
    let client = reqwest::Client::new();

    let request_body = HttpPayRequest { act: needed_act };
    let json_body = serde_json::to_string(&request_body)
        .map_err(|e| format!("Ошибка сериализации: {}", e))?;

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(CONTENT_LENGTH, HeaderValue::from_str(&json_body.len().to_string()).unwrap());

    let res = client
        .post(FAKE_SERVER_URL)
        .headers(headers)
        .body(json_body)
        .send()
        .await
        .map_err(|e| format!("{} error: {}", needed_act, e))?;

    let text = res.text().await.unwrap_or_else(|_| "Нет ответа".into());
    println!("{} response: {}", needed_act, text);

    Ok(())
}