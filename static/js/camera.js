// Camera and microphone handling - Fixed version
class CameraManager {
    constructor() {
        this.cameraStream = null;
        this.audioStream = null;
        this.isCameraOn = false;
        this.isMicOn = false;
        
        this.videoElement = document.getElementById('camera-feed');
        this.cameraOffElement = document.getElementById('camera-off');
        this.toggleCameraBtn = document.getElementById('toggle-camera');
        this.toggleMicBtn = document.getElementById('toggle-mic');
        
        this.init();
    }
    
    init() {
        if (this.toggleCameraBtn) {
            this.toggleCameraBtn.addEventListener('click', () => this.toggleCamera());
        }
        
        if (this.toggleMicBtn) {
            this.toggleMicBtn.addEventListener('click', () => this.toggleMicrophone());
        }
        
        // Initially show camera off
        this.showCameraOff();
        
        // Check browser permissions
        this.checkPermissions();
    }
    
    async checkPermissions() {
        try {
            // Check camera permission
            const cameraPermission = await navigator.permissions.query({ name: 'camera' });
            cameraPermission.onchange = () => this.updatePermissionUI('camera', cameraPermission.state);
            
            // Check microphone permission
            const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
            microphonePermission.onchange = () => this.updatePermissionUI('microphone', microphonePermission.state);
            
        } catch (error) {
            console.log('Permission API not supported in this browser');
        }
    }
    
    updatePermissionUI(device, state) {
        console.log(`${device} permission state: ${state}`);
        
        if (device === 'microphone' && state === 'denied') {
            alert('Microphone access is blocked. Please enable it in your browser settings.');
        }
    }
    
    async toggleCamera() {
        if (this.isCameraOn) {
            await this.stopCamera();
        } else {
            await this.startCamera();
        }
    }
    
    async toggleMicrophone() {
        if (this.isMicOn) {
            await this.stopMicrophone();
        } else {
            await this.startMicrophone();
        }
    }
    
    async startCamera() {
        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            
            this.videoElement.srcObject = this.cameraStream;
            this.isCameraOn = true;
            this.showCameraOn();
            
            this.updateCameraButton(true);
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showCameraError(error);
        }
    }
    
    async stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        this.videoElement.srcObject = null;
        this.isCameraOn = false;
        this.showCameraOff();
        
        this.updateCameraButton(false);
    }
    
    async startMicrophone() {
        try {
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                },
                video: false
            });
            
            this.isMicOn = true;
            this.updateMicrophoneButton(true);
            
            console.log('Microphone started successfully');
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.showMicrophoneError(error);
        }
    }
    
    async stopMicrophone() {
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
        
        this.isMicOn = false;
        this.updateMicrophoneButton(false);
    }
    
    updateCameraButton(isOn) {
        if (!this.toggleCameraBtn) return;
        
        if (isOn) {
            this.toggleCameraBtn.innerHTML = '<i class="fas fa-video-slash mr-1"></i> Turn Off Camera';
            this.toggleCameraBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            this.toggleCameraBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        } else {
            this.toggleCameraBtn.innerHTML = '<i class="fas fa-video mr-1"></i> Turn On Camera';
            this.toggleCameraBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
            this.toggleCameraBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }
    }
    
    updateMicrophoneButton(isOn) {
        if (!this.toggleMicBtn) return;
        
        if (isOn) {
            this.toggleMicBtn.innerHTML = '<i class="fas fa-microphone-slash mr-1"></i> Mute';
            this.toggleMicBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            this.toggleMicBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        } else {
            this.toggleMicBtn.innerHTML = '<i class="fas fa-microphone mr-1"></i> Unmute';
            this.toggleMicBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
            this.toggleMicBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        }
    }
    
    showCameraOn() {
        if (this.videoElement && this.cameraOffElement) {
            this.videoElement.classList.remove('hidden');
            this.cameraOffElement.classList.add('hidden');
        }
    }
    
    showCameraOff() {
        if (this.videoElement && this.cameraOffElement) {
            this.videoElement.classList.add('hidden');
            this.cameraOffElement.classList.remove('hidden');
        }
    }
    
    showCameraError(error) {
        let message = 'Could not access camera. ';
        
        if (error.name === 'NotAllowedError') {
            message += 'Please allow camera access in your browser settings.';
        } else if (error.name === 'NotFoundError') {
            message += 'No camera found. Please connect a camera.';
        } else if (error.name === 'NotReadableError') {
            message += 'Camera is already in use by another application.';
        }
        
        alert(message);
    }
    
    showMicrophoneError(error) {
        let message = 'Could not access microphone. ';
        
        if (error.name === 'NotAllowedError') {
            message += 'Please allow microphone access in your browser settings.';
        } else if (error.name === 'NotFoundError') {
            message += 'No microphone found. Please connect a microphone.';
        } else if (error.name === 'NotReadableError') {
            message += 'Microphone is already in use by another application.';
        }
        
        alert(message);
    }
    
    stopAll() {
        this.stopCamera();
        this.stopMicrophone();
    }
    
    // Get microphone stream for other uses (like speech recognition)
    async getMicrophoneStream() {
        if (this.audioStream) {
            return this.audioStream;
        }
        
        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
        } catch (error) {
            console.error('Error getting microphone stream:', error);
            return null;
        }
    }
}

// Initialize camera manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.cameraManager = new CameraManager();
});

// // Camera and microphone handling
// class CameraManager {
//     constructor() {
//         this.cameraStream = null;
//         this.audioStream = null;
//         this.isCameraOn = false;
//         this.isMicOn = false;
        
//         this.videoElement = document.getElementById('camera-feed');
//         this.cameraOffElement = document.getElementById('camera-off');
//         this.toggleCameraBtn = document.getElementById('toggle-camera');
//         this.toggleMicBtn = document.getElementById('toggle-mic');
        
//         this.init();
//     }
    
//     init() {
//         this.toggleCameraBtn.addEventListener('click', () => this.toggleCamera());
//         this.toggleMicBtn.addEventListener('click', () => this.toggleMicrophone());
        
//         // Initially show camera off
//         this.showCameraOff();
//     }
    
//     async toggleCamera() {
//         if (this.isCameraOn) {
//             await this.stopCamera();
//         } else {
//             await this.startCamera();
//         }
//     }
    
//     async toggleMicrophone() {
//         if (this.isMicOn) {
//             await this.stopMicrophone();
//         } else {
//             await this.startMicrophone();
//         }
//     }
    
//     async startCamera() {
//         try {
//             this.cameraStream = await navigator.mediaDevices.getUserMedia({
//                 video: {
//                     width: { ideal: 640 },
//                     height: { ideal: 480 },
//                     facingMode: 'user'
//                 }
//             });
            
//             this.videoElement.srcObject = this.cameraStream;
//             this.isCameraOn = true;
//             this.showCameraOn();
            
//             this.toggleCameraBtn.innerHTML = '<i class="fas fa-video-slash mr-1"></i> Turn Off Camera';
//             this.toggleCameraBtn.classList.remove('bg-blue-600');
//             this.toggleCameraBtn.classList.add('bg-red-600');
            
//         } catch (error) {
//             console.error('Error accessing camera:', error);
//             alert('Could not access camera. Please check permissions.');
//         }
//     }
    
//     async stopCamera() {
//         if (this.cameraStream) {
//             this.cameraStream.getTracks().forEach(track => track.stop());
//             this.cameraStream = null;
//         }
        
//         this.videoElement.srcObject = null;
//         this.isCameraOn = false;
//         this.showCameraOff();
        
//         this.toggleCameraBtn.innerHTML = '<i class="fas fa-video mr-1"></i> Turn On Camera';
//         this.toggleCameraBtn.classList.remove('bg-red-600');
//         this.toggleCameraBtn.classList.add('bg-blue-600');
//     }
    
//     async startMicrophone() {
//         try {
//             this.audioStream = await navigator.mediaDevices.getUserMedia({
//                 audio: {
//                     echoCancellation: true,
//                     noiseSuppression: true,
//                     sampleRate: 44100
//                 }
//             });
            
//             this.isMicOn = true;
//             this.toggleMicBtn.innerHTML = '<i class="fas fa-microphone-slash mr-1"></i> Mute';
//             this.toggleMicBtn.classList.remove('bg-green-600');
//             this.toggleMicBtn.classList.add('bg-red-600');
            
//         } catch (error) {
//             console.error('Error accessing microphone:', error);
//             alert('Could not access microphone. Please check permissions.');
//         }
//     }
    
//     async stopMicrophone() {
//         if (this.audioStream) {
//             this.audioStream.getTracks().forEach(track => track.stop());
//             this.audioStream = null;
//         }
        
//         this.isMicOn = false;
//         this.toggleMicBtn.innerHTML = '<i class="fas fa-microphone mr-1"></i> Unmute';
//         this.toggleMicBtn.classList.remove('bg-red-600');
//         this.toggleMicBtn.classList.add('bg-green-600');
//     }
    
//     showCameraOn() {
//         this.videoElement.classList.remove('hidden');
//         this.cameraOffElement.classList.add('hidden');
//     }
    
//     showCameraOff() {
//         this.videoElement.classList.add('hidden');
//         this.cameraOffElement.classList.remove('hidden');
//     }
    
//     stopAll() {
//         this.stopCamera();
//         this.stopMicrophone();
//     }
// }

// // Initialize camera manager when page loads
// document.addEventListener('DOMContentLoaded', () => {
//     window.cameraManager = new CameraManager();
// });