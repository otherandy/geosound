export interface AudioData {
  file: File;
  filename: string;
  latitude: number;
  longitude: number;
  loudness?: number;
  tags: string[];
}
