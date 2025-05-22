use chrono::NaiveTime;

use std::process::Command;
use std::os::windows::process::CommandExt;
use windows_sys::Win32::System::Threading::CREATE_NO_WINDOW;

use crate::globals::{WorkHours, PROJECT_PATH};
use crate::fs_utils::{reading_from_json_file, writing_to_json_file};
use std::path::PathBuf;

use std::{fs, path::Path, io::Write};

#[tauri::command]
pub fn get_work_hours() -> Result<WorkHours, String> {
    let data: WorkHours = reading_from_json_file("time/time.json").map_err(|e| e.to_string())?;
    Ok(data)
}


#[tauri::command]
pub fn set_work_hours(start: String, end: String, is_always_active: bool) -> Result<(), String> {

    let sleep_time  = NaiveTime::parse_from_str(&end, "%H:%M").map_err(|e| e.to_string())?;
    let wake_time  = NaiveTime::parse_from_str(&start, "%H:%M").map_err(|e| e.to_string())?;

    let work_hours = WorkHours { start: start.clone(), end: end.clone(), is_always_active: is_always_active.clone() };
    if let Err(_e) = writing_to_json_file("time/time.json", &work_hours) {
        // eprintln!("Failed to write to JSON file: {}", e);
    }
    let base_path = PROJECT_PATH.lock().unwrap()
        .clone()
        .ok_or("Project path is not set. Call update_project_path first.")?;

    let mut script_dir = base_path.join("time");
    let _ = create_powershell_script(script_dir.clone());
    script_dir = script_dir.join("wake_script.ps1");
    let str_script_dir = script_dir.to_string_lossy();
    // let now = Local::now().time();
    // // Вычисляем задержки для сна и пробуждения
    // let _sleep_duration = if sleep_time > now {
    //     (sleep_time - now).num_seconds()
    // } else {
    //     (sleep_time + chrono::Duration::hours(24) - now).num_seconds()
    // };

    // let _wake_duration = if wake_time > now {
    //     (wake_time - now).num_seconds()
    // } else {
    //     (wake_time + chrono::Duration::hours(24) - now).num_seconds()
    // };
    // Логируем оставшееся время
    // if !is_always_active {
    //     println!(
    //         "Оставшееся время до сна: {} секунд ({} часов, {} минут)",
    //         sleep_duration,
    //         sleep_duration / 3600,
    //         (sleep_duration % 3600) / 60
    //     );
    //     println!(
    //         "Оставшееся время до пробуждения: {} секунд ({} часов, {} минут)",
    //         wake_duration,
    //         wake_duration / 3600,
    //         (wake_duration % 3600) / 60
    //     );
    // }
    
    // Настраиваем таймер на вход в спящий режим

        let sleep_time_formatted = sleep_time.format("%H:%M:%S").to_string();
        let remote_sleep_script = r#"
if (Get-ScheduledTask -TaskName "DailySleepTask" -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName "DailySleepTask" -Confirm:$false
    Write-Output "Task removed successfully."
} else {
    Write-Output "Task does not exist."
}
"#;
        let ps_sleep_script = format!(
r#"
# Check if task already exists, if so, delete it
if (Get-ScheduledTask -TaskName "DailySleepTask" -ErrorAction SilentlyContinue) {{
    Unregister-ScheduledTask -TaskName "DailySleepTask" -Confirm:$false
}}

# Task start time
$taskTime = "{sleep_time}"

# XML file for task
$taskXmlPath = "$env:temp\DailySleepTask.xml"

# Generate XML file
@"
<?xml version="1.0" encoding="UTF-16"?>
<Task xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
    <RegistrationInfo>
    <Description>Daily task to sleep the computer and execute the task</Description>
    </RegistrationInfo>
    <Triggers>
    <CalendarTrigger>
        <StartBoundary>$((Get-Date -Format "yyyy-MM-ddT") + $taskTime)</StartBoundary>
        <Enabled>true</Enabled>
        <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
        </ScheduleByDay>
    </CalendarTrigger>
    </Triggers>
    <Settings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <StartWhenAvailable>true</StartWhenAvailable>
    <WakeToRun>true</WakeToRun>
    <AllowHardTerminate>false</AllowHardTerminate>
    <RestartOnFailure>
        <Interval>PT1M</Interval>
        <Count>3</Count>
    </RestartOnFailure>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    </Settings>
    <Actions Context="Author">
    <Exec>
        <Command>shutdown</Command>
        <Arguments>/h</Arguments>
    </Exec>
    </Actions>
</Task>
"@ | Out-File -Encoding UTF8 -FilePath $taskXmlPath

powercfg /hibernate on
powercfg /h /type full

# Register task with XML
Register-ScheduledTask -Xml (Get-Content $taskXmlPath -Raw) -TaskName "DailySleepTask"

# Remove the temporary XML file
Remove-Item $taskXmlPath -Force
"#,
                sleep_time = sleep_time_formatted
            );
    
        if is_always_active{
            let _output = Command::new("powershell")
            .args(&["-Command", &remote_sleep_script])
            .creation_flags(CREATE_NO_WINDOW) // <-- Отключает всплывающее окно PowerShell
            .output()
            .map_err(|e| format!("Failed to execute PowerShell script: {}", e))?;
        }
        else{
            let _output = Command::new("powershell")
            .args(&["-Command", &ps_sleep_script])
            .creation_flags(CREATE_NO_WINDOW) // <-- Отключает всплывающее окно PowerShell
            .output()
            .map_err(|e| format!("Failed to execute PowerShell script: {}", e))?;    
        }

        // thread::spawn(move || {
        //     loop {
        //         let current_time = Local::now().time();
        //         // Если текущее время равно времени выключения, переводим компьютер в спящий режим
        //         if current_time >= sleep_time && current_time < sleep_time + chrono::Duration::minutes(1) {
        //             Command::new("shutdown")
        //                 .args(&["/h", "/f"])
        //                 .creation_flags(CREATE_NO_WINDOW) // <-- Отключает всплывающее окно PowerShell
        //                 .stdout(Stdio::null()) // Отключает вывод в консоль
        //                 .stderr(Stdio::null()) // Отключает ошибки в консоль  // Перевод в спящий режим с принудительным закрытием приложений
        //                 .spawn()
        //                 .expect("Не удалось перевести компьютер в спящий режим");
        //         }
        //         // Проверяем каждые 30 секунд
        //         thread::sleep(Duration::from_secs(30));
        //     }
        // });
    let wake_time_formatted = wake_time.format("%H:%M:%S").to_string();

    let remote_wake_script = r#"
if (Get-ScheduledTask -TaskName "DailyWakeUpTask" -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName "DailyWakeUpTask" -Confirm:$false
    Write-Output "Task removed successfully."
} else {
    Write-Output "Task does not exist."
}
"#;
    let ps_wake_script = format!(
r#"
# Check if task already exists, if so, delete it
if (Get-ScheduledTask -TaskName "DailyWakeUpTask" -ErrorAction SilentlyContinue) {{
    Unregister-ScheduledTask -TaskName "DailyWakeUpTask" -Confirm:$false
}}

# Task start time
$taskTime = "{wake_time}"

# XML path
$taskXmlPath = "$env:temp\DailyWakeUpTask.xml"

# Составляем XML-строку
$taskXmlContent = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Daily wake up the computer and execute the task</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>$((Get-Date -Format "yyyy-MM-ddT") + $taskTime)</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Settings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <StartWhenAvailable>true</StartWhenAvailable>
    <WakeToRun>true</WakeToRun>
    <AllowHardTerminate>false</AllowHardTerminate>
    <RestartOnFailure>
      <Interval>PT1M</Interval>
      <Count>3</Count>
    </RestartOnFailure>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
  </Settings>
  <Principals>
    <Principal id="Author">
      <UserId>$env:USERDOMAIN\$env:USERNAME</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Actions Context="Author">
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>-ExecutionPolicy Bypass -File "{wake_script_dir}"</Arguments>
    </Exec>
  </Actions>
</Task>
"@

[System.IO.File]::WriteAllText($taskXmlPath, $taskXmlContent, [System.Text.Encoding]::Unicode)

powercfg -setacvalueindex SCHEME_CURRENT SUB_SLEEP RTCWake 1
powercfg -S SCHEME_CURRENT
# Register task with XML
schtasks /Create /TN "DailyWakeUpTask" /XML "$taskXmlPath" /F

# Remove the temporary XML file
Remove-Item $taskXmlPath -Force
"#,
            wake_time = wake_time_formatted,
            wake_script_dir = str_script_dir
        );

    if is_always_active{
        let _output = Command::new("powershell")
        .args(&["-Command", &remote_wake_script])
        .creation_flags(CREATE_NO_WINDOW) // <-- Отключает всплывающее окно PowerShell
        .output()
        .map_err(|e| format!("Failed to execute PowerShell script: {}", e))?;
    }
    else{
        println!("{}", ps_wake_script);
        let _output = Command::new("powershell")
        .args(&["-Command", &ps_wake_script])
        .creation_flags(CREATE_NO_WINDOW) // <-- Отключает всплывающее окно PowerShell
        .output()
        .map_err(|e| format!("Failed to execute PowerShell script: {}", e))?;    
    }
    Ok(())
}

#[tauri::command]
fn create_powershell_script(folder_path: PathBuf) -> Result<String, String> {
    // Проверяем, существует ли папка
    let path = Path::new(&folder_path);
    if !path.exists() {
        return Err("Указанная папка не существует".to_string());
    }
    
    // Создаём путь к файлу
    let script_path = path.join("wake_script.ps1");
    
    // PowerShell-код
    let script_content = r#"
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Keyboard {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    public static void PressKey(byte key) {
        keybd_event(key, 0, 0, UIntPtr.Zero); // Нажатие
        keybd_event(key, 0, 2, UIntPtr.Zero); // Отпускание
    }
}
"@ -Language CSharp

Start-Sleep -Seconds 3  # Ждём 3 секунды после пробуждения
[Keyboard]::PressKey(0x0D)  # 0x0D — это клавиша "Enter"
Start-Sleep -Seconds 60  # Ждём 30 секунды после пробуждения
[Keyboard]::PressKey(0x0D)  # 0x0D — это клавиша "Enter"
Start-Sleep -Seconds 5  # Ждём 5 секунд после пробуждения
[Keyboard]::PressKey(0x0D)  # 0x0D — это клавиша "Enter"
Start-Sleep -Seconds 3  # Ждём 3 секунд после пробуждения
[Keyboard]::PressKey(0x0D)  # 0x0D — это клавиша "Enter"
"#;
    
    // Записываем в файл
    match fs::File::create(&script_path) {
        Ok(mut file) => {
            if let Err(e) = file.write_all(script_content.as_bytes()) {
                return Err(format!("Ошибка при записи в файл: {}", e));
            }
        }
        Err(e) => return Err(format!("Ошибка при создании файла: {}", e)),
    }
    
    Ok(script_path.to_string_lossy().into_owned())
}