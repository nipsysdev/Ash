export type DownloadEvent =
    | {
          event: 'started';
          data: {
              url: string;
              download_id: number;
              content_length: number;
          };
      }
    | {
          event: 'progress';
          data: {
              download_id: number;
              chunk_length: number;
          };
      }
    | {
          event: 'finished';
          data: {
              download_id: number;
          };
      };
