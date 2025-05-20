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
    pub payment_enabled: bool
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

pub static PRIVATE_KEY_CODE: &str = r#"-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----"#;