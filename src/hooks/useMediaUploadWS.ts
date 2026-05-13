import {useCallback, useEffect, useRef, useState} from 'react';
import {toast} from 'sonner';

interface UploadProgress {
  fileId: string;
  progress: number;
  status: string;
}

interface UseMediaUploadWSOptions {
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (fileId: string) => void;
  onError?: (fileId: string, error: string) => void;
}

export const useMediaUploadWS = (options: UseMediaUploadWSOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeUploads, setActiveUploads] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectingRef = useRef(false);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    isConnectingRef.current = false;
  }, []);

  const connect = useCallback(async () => {
    if (isConnectingRef.current) {
      console.log('WebSocket connection already in progress');
      return;
    }

    try {
      isConnectingRef.current = true;

      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token for WebSocket');
        isConnectingRef.current = false;
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/media`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({ token }));
        setIsConnected(true);
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message:', data);

          switch (data.type) {
            case 'progress':
              options.onProgress?.({
                fileId: data.file_id,
                progress: data.progress,
                status: data.status,
              });
              break;

            case 'completed':
              setActiveUploads((prev) => {
                const next = new Set(prev);
                next.delete(data.file_id);
                return next;
              });
              options.onComplete?.(data.file_id);
              break;

            case 'error':
              setActiveUploads((prev) => {
                const next = new Set(prev);
                next.delete(data.file_id);
                return next;
              });
              options.onError?.(data.file_id, data.message);
              toast.error(data.message);
              break;

            case 'active_uploads':
              setActiveUploads(new Set(data.file_ids));
              break;

            case 'upload_cancelled':
              setActiveUploads((prev) => {
                const next = new Set(prev);
                next.delete(data.file_id);
                return next;
              });
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          isConnectingRef.current = false;
            // eslint-disable-next-line react-hooks/immutability
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      isConnectingRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  }, [options, disconnect]);

  const cancelUpload = useCallback((fileId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isConnected) {
      wsRef.current.send(JSON.stringify({
        action: 'cancel_upload',
        file_id: fileId,
      }));
    }
  }, [isConnected]);

  const getActiveUploads = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isConnected) {
      wsRef.current.send(JSON.stringify({
        action: 'get_active_uploads',
      }));
    }
  }, [isConnected]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    activeUploads,
    cancelUpload,
    getActiveUploads,
  };
};