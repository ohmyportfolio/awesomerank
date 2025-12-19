#!/bin/bash

# World Rank 관리 스크립트
# Usage: ./manage.sh [command]

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$PROJECT_DIR/server"
FRONTEND_DIR="$PROJECT_DIR/frontend"
PID_FILE="$SERVER_DIR/.server.pid"
LOG_FILE="$SERVER_DIR/server.log"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 서버 PID 가져오기
get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    else
        echo ""
    fi
}

# 서버 실행 중인지 확인
is_running() {
    local pid=$(get_pid)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# 서버 시작
cmd_start() {
    if is_running; then
        print_warning "서버가 이미 실행 중입니다 (PID: $(get_pid))"
        return 1
    fi

    print_status "서버 시작 중..."
    cd "$SERVER_DIR"
    nohup node server.js > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 1

    if is_running; then
        print_success "서버 시작됨 (PID: $(get_pid))"
        print_status "URL: http://localhost:3000"
    else
        print_error "서버 시작 실패. 로그 확인: ./manage.sh log"
        return 1
    fi
}

# 서버 중지
cmd_stop() {
    if ! is_running; then
        print_warning "서버가 실행 중이 아닙니다"
        rm -f "$PID_FILE"
        return 1
    fi

    local pid=$(get_pid)
    print_status "서버 중지 중... (PID: $pid)"
    kill "$pid" 2>/dev/null

    # 종료 대기 (최대 5초)
    for i in {1..10}; do
        if ! kill -0 "$pid" 2>/dev/null; then
            break
        fi
        sleep 0.5
    done

    # 강제 종료
    if kill -0 "$pid" 2>/dev/null; then
        print_warning "강제 종료 중..."
        kill -9 "$pid" 2>/dev/null
    fi

    rm -f "$PID_FILE"
    print_success "서버 중지됨"
}

# 서버 재시작
cmd_restart() {
    cmd_stop
    sleep 1
    cmd_start
}

# 프론트엔드 빌드
cmd_build() {
    print_status "프론트엔드 빌드 중..."
    cd "$FRONTEND_DIR"

    if npm run build; then
        print_success "빌드 완료: $FRONTEND_DIR/dist"
    else
        print_error "빌드 실패"
        return 1
    fi
}

# 로그 보기
cmd_log() {
    local lines=${1:-50}
    if [ -f "$LOG_FILE" ]; then
        print_status "최근 로그 ($lines 줄):"
        echo "----------------------------------------"
        tail -n "$lines" "$LOG_FILE"
    else
        print_warning "로그 파일이 없습니다"
    fi
}

# 로그 실시간 보기
cmd_logf() {
    if [ -f "$LOG_FILE" ]; then
        print_status "실시간 로그 (Ctrl+C로 종료):"
        echo "----------------------------------------"
        tail -f "$LOG_FILE"
    else
        print_warning "로그 파일이 없습니다"
    fi
}

# 상태 확인
cmd_status() {
    echo ""
    echo "========================================"
    echo "       World Rank 서버 상태"
    echo "========================================"

    if is_running; then
        local pid=$(get_pid)
        echo -e "상태:    ${GREEN}● 실행 중${NC}"
        echo "PID:     $pid"
        echo "URL:     http://localhost:3000"

        # 메모리/CPU 사용량
        if command -v ps &> /dev/null; then
            local mem=$(ps -o rss= -p "$pid" 2>/dev/null | awk '{print int($1/1024)"MB"}')
            echo "메모리:  $mem"
        fi
    else
        echo -e "상태:    ${RED}● 중지됨${NC}"
    fi

    # DB 통계
    if [ -f "$SERVER_DIR/data/responses.db" ]; then
        local count=$(sqlite3 "$SERVER_DIR/data/responses.db" "SELECT COUNT(*) FROM responses;" 2>/dev/null || echo "0")
        echo "응답 수: $count 건"
    fi

    echo "========================================"
    echo ""
}

# DB 통계
cmd_stats() {
    local db="$SERVER_DIR/data/responses.db"

    if [ ! -f "$db" ]; then
        print_error "데이터베이스 파일이 없습니다"
        return 1
    fi

    echo ""
    echo "========================================"
    echo "         응답 통계"
    echo "========================================"

    local total=$(sqlite3 "$db" "SELECT COUNT(*) FROM responses;")
    echo "총 응답 수: $total"
    echo ""

    echo "[ 국가별 ]"
    sqlite3 -column -header "$db" "
        SELECT country, COUNT(*) as count
        FROM responses
        GROUP BY country
        ORDER BY count DESC
        LIMIT 10;
    "
    echo ""

    echo "[ 연령대별 ]"
    sqlite3 -column -header "$db" "
        SELECT age_group, COUNT(*) as count
        FROM responses
        WHERE age_group IS NOT NULL
        GROUP BY age_group
        ORDER BY age_group;
    "
    echo ""

    echo "[ 언어별 ]"
    sqlite3 -column -header "$db" "
        SELECT selected_language as lang, COUNT(*) as count
        FROM responses
        WHERE selected_language IS NOT NULL
        GROUP BY selected_language
        ORDER BY count DESC
        LIMIT 10;
    "
    echo ""

    echo "[ 기기별 ]"
    sqlite3 -column -header "$db" "
        SELECT device_type, COUNT(*) as count
        FROM responses
        GROUP BY device_type;
    "
    echo "========================================"
}

# 개발 서버 실행 (프론트엔드 + 백엔드)
cmd_dev() {
    print_status "개발 서버 시작..."

    # 백엔드 서버 시작
    cmd_start

    # 프론트엔드 dev 서버 실행
    print_status "프론트엔드 개발 서버 시작..."
    cd "$FRONTEND_DIR"
    npm run dev
}

# 클린업
cmd_clean() {
    print_status "빌드 파일 정리 중..."
    rm -rf "$FRONTEND_DIR/dist"
    rm -f "$LOG_FILE"
    print_success "정리 완료"
}

# 도움말
cmd_help() {
    echo ""
    echo "World Rank 관리 스크립트"
    echo ""
    echo "사용법: ./manage.sh [명령어]"
    echo ""
    echo "명령어:"
    echo "  start       서버 시작"
    echo "  stop        서버 중지"
    echo "  restart     서버 재시작"
    echo "  status      서버 상태 확인"
    echo "  build       프론트엔드 빌드"
    echo "  dev         개발 모드 실행 (백엔드 + 프론트 dev)"
    echo "  log [n]     최근 로그 보기 (기본 50줄)"
    echo "  logf        실시간 로그 보기"
    echo "  stats       DB 통계 보기"
    echo "  clean       빌드/로그 파일 정리"
    echo "  help        도움말"
    echo ""
}

# 메인
case "${1:-}" in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    status)
        cmd_status
        ;;
    build)
        cmd_build
        ;;
    dev)
        cmd_dev
        ;;
    log)
        cmd_log "${2:-50}"
        ;;
    logf)
        cmd_logf
        ;;
    stats)
        cmd_stats
        ;;
    clean)
        cmd_clean
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        if [ -n "${1:-}" ]; then
            print_error "알 수 없는 명령어: $1"
        fi
        cmd_help
        exit 1
        ;;
esac
