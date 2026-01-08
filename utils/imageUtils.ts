import { LOCAL_IP } from '../constants/Config';

export const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  
  if (url.includes('localhost')) {
    return url.replace('localhost', LOCAL_IP);
  }
  
  return url;
};
