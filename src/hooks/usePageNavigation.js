import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import { useStore } from '../admin/store';
import { invoke } from '@tauri-apps/api/tauri';

export function usePageNavigation() {
    const navigate = useNavigate();
    const { camera, setCamera, project } = useStore();
  
    useEffect(() => {
      const unlisten = listen('navigate-to-page', (event) => {
        const targetPage = event.payload;
  
        if (targetPage === 'main_page') {
          navigate('/'); // React Router navigation to main page
        } else if (targetPage === 'setting_page') {
          navigate('/settings'); // React Router navigation to settings page
        }
      });
  
      const cameraStatusCheck = async () => {
        // if (camera.isLiveView) {
        //   await invoke('stop_live_view');
        //   setCamera({ ...camera, isLiveView: false });
        //   navigate('/');
        // }

        if (project.isCurrent) {
          navigate('/');
        }
      }
  
      cameraStatusCheck();
      // Cleanup listener on component unmount
      return () => {
        unlisten.then((off) => off());
      };
    }, [navigate, camera, project]);
  }
