export type DownloadEvent =
    | {
          event: 'started';
          data: {
              url: string;
              downloadId: number;
              contentLength: number;
          };
      }
    | {
          event: 'progress';
          data: {
              downloadId: number;
              chunkLength: number;
          };
      }
    | {
          event: 'finished';
          data: {
              downloadId: number;
          };
      };
