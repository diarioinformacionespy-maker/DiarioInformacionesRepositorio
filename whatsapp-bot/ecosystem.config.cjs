module.exports = {
  apps: [{
    name: 'whatsapp-bot',
    script: 'src/index.js',
    instances: 1,            // NUNCA más de 1: dos procesos con la misma sesión se pisan
    autorestart: true,
    max_memory_restart: '400M',
    restart_delay: 5000,
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    time: true,
  }],
}
