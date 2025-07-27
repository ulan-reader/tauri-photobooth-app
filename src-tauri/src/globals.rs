use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};

lazy_static::lazy_static! {
    pub static ref PROJECT_PATH: Arc<Mutex<Option<PathBuf>>> = Arc::new(Mutex::new(None));
}



//-------------------------------------------------WorkHours-------------------------------------------------------------------------------------
#[derive(Serialize, Deserialize, Debug)]
pub struct WorkHours {
    pub start: String,
    pub end: String,
    pub is_always_active: bool,
}



//-------------------------------------------------Printer-------------------------------------------------------------------------------------
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PrinterInfo {
    pub id: u32,
    pub name: String,
    pub state: String,
    pub system_name: String,
    pub driver_name: String,
    pub is_used: bool,
}

#[derive(Default, Debug)]
pub struct PrinterState {
    pub selected_printer: Mutex<Option<PrinterInfo>>,
}

//-------------------------------------------------Project-------------------------------------------------------------------------------------
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectInfo{
    pub id: u32,
    pub name: String,
    pub is_used: bool,
}

impl ProjectInfo {
    pub fn from_path(path: &std::path::Path) -> Option<Self> {
        let name = path.file_name()?.to_string_lossy().to_string();
        Some(ProjectInfo {
            id: crc32fast::hash(name.as_bytes()),
            name,
            is_used: false,
        })
    }
}


//-------------------------------------------------Chromokey-------------------------------------------------------------------------------------
#[derive(Serialize, Deserialize, Debug)]
pub struct ChromokeyInfo {
    pub color: String,
    pub is_enabled: bool,
    pub counter_capture_photo: u32,
    pub printer_visible: bool,
    pub payment_enabled: bool,
    pub toggle_autofocus: bool,
}


#[derive(Serialize)]
pub struct TemplatePaths {
    pub json: String,
    pub image: String,
}
//-------------------------------------------------License-------------------------------------------------------------------------------------
pub struct LicenseState {
    pub license: Mutex<Option<String>>,
}

pub static PRIVATE_KEY_CODE: &str = include_str!("private_key.pem");