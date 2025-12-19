module.exports = {
  apps: [{
    name: 'worldrank',
    cwd: '/projects/worldrank/server',
    script: 'server.js',
    instances: 'max',  // CPU 코어 수만큼 인스턴스 생성 (Turso는 동시 접속 지원)
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '500M',
    error_file: '/projects/worldrank/logs/error.log',
    out_file: '/projects/worldrank/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    watch: false,
    autorestart: true,
    merge_logs: true
  }]
};
