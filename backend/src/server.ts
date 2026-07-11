import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { ticketService } from './modules/tickets/ticket.service.js';
import { gmailService } from './modules/email/gmail.service.js';
import { ensureUploadDir } from './shared/storage/file-storage.js';

const app = createApp();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: { origin: env.CORS_ORIGIN, credentials: true },
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

ticketService.setSocket(io);

void ensureUploadDir();

httpServer.listen(env.PORT, () => {
  console.log(`🚀 AI Customer Support API running on http://localhost:${env.PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);

  if (env.GMAIL_DEMO_ONLY) {
    console.log('📋 Demo-only mode: Gmail disabled, using seed tickets only');
    void gmailService.enableDemoOnlyMode().then((result) => {
      if (result.deletedTickets > 0 || result.deletedCustomers > 0) {
        console.log(
          `🧹 Removed ${result.deletedTickets} real email ticket(s) and ${result.deletedCustomers} non-demo customer(s)`,
        );
      }
    });
    return;
  }

  gmailService.startAutoSync();
  void gmailService.cleanupPastImportedTickets().then((result) => {
    if (result.deletedTickets > 0) {
      console.log(`🧹 Removed ${result.deletedTickets} past email ticket(s) (keeping today onward only)`);
    }
  });
});

export { io };
