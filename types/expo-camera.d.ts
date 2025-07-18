declare module 'expo-camera' {
  import { ViewProps } from 'react-native';
  import { Component } from 'react';

  export type CameraType = 'front' | 'back';
  export type FlashMode = 'on' | 'off' | 'auto' | 'torch';
  export type WhiteBalance = 'auto' | 'sunny' | 'cloudy' | 'shadow' | 'incandescent' | 'fluorescent';
  export type AutoFocus = 'on' | 'off';

  export interface CameraProps extends ViewProps {
    type?: CameraType;
    flashMode?: FlashMode;
    autoFocus?: AutoFocus;
    zoom?: number;
    whiteBalance?: WhiteBalance;
    ratio?: string;
    onCameraReady?: () => void;
    onMountError?: (error: Error) => void;
  }

  export interface RecordingOptions {
    quality?: string | number;
    maxDuration?: number;
    maxFileSize?: number;
    mute?: boolean;
  }

  export interface CameraRecordingOptions extends RecordingOptions {
    mirror?: boolean;
  }

  export class Camera extends Component<CameraProps> {
    static Constants: {
      Type: {
        front: 'front';
        back: 'back';
      };
      FlashMode: {
        on: 'on';
        off: 'off';
        auto: 'auto';
        torch: 'torch';
      };
      AutoFocus: {
        on: 'on';
        off: 'off';
      };
      WhiteBalance: {
        auto: 'auto';
        sunny: 'sunny';
        cloudy: 'cloudy';
        shadow: 'shadow';
        incandescent: 'incandescent';
        fluorescent: 'fluorescent';
      };
    };

    takePictureAsync(options?: {
      quality?: number;
      base64?: boolean;
      exif?: boolean;
      onPictureSaved?: (photo: any) => void;
      skipProcessing?: boolean;
    }): Promise<{
      uri: string;
      width: number;
      height: number;
      base64?: string;
      exif?: any;
    }>;

    recordAsync(options?: CameraRecordingOptions): Promise<{
      uri: string;
      codec?: string;
      duration?: number;
    }>;

    stopRecording(): void;
    pausePreview(): void;
    resumePreview(): void;

    static requestCameraPermissionsAsync(): Promise<{ status: 'granted' | 'denied' }>;
    static requestMicrophonePermissionsAsync(): Promise<{ status: 'granted' | 'denied' }>;
  }

  export default Camera;
} 