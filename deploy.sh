#!/bin/bash
set -euo pipefail

SERVER="fsh-test-server"
REMOTE_DIR="/opt/camunda/7"
BACKUP_DIR="/opt/camunda/7.bak.$(date +%Y%m%d-%H%M%S)"
LOCAL_ARTIFACT=".m2/repository/org/camunda/bpm/run/camunda-bpm-run-assembly/7.24.0-SNAPSHOT/camunda-bpm-run-assembly-7.24.0-SNAPSHOT.tar.gz"

echo "=== [1/6] Stopping Camunda ==="
ssh "$SERVER" "systemctl stop camunda 2>/dev/null; sleep 3; echo 'Stopped'"

echo "=== [2/6] Backing up current install to $BACKUP_DIR ==="
ssh "$SERVER" "cp -a $REMOTE_DIR $BACKUP_DIR && echo 'Backup: $BACKUP_DIR'"

echo "=== [3/6] Preserving config and userlib ==="
ssh "$SERVER" "
  cp -a $REMOTE_DIR/configuration/default.yml /tmp/camunda-default.yml
  cp -a $REMOTE_DIR/configuration/userlib /tmp/camunda-userlib
  echo 'Preserved default.yml and userlib/'
"

echo "=== [4/6] Uploading and extracting new build ==="
scp "$LOCAL_ARTIFACT" "$SERVER:/tmp/camunda-run.tar.gz"
ssh "$SERVER" "
  rm -rf $REMOTE_DIR/*
  tar xzf /tmp/camunda-run.tar.gz -C $REMOTE_DIR
  rm /tmp/camunda-run.tar.gz
  echo 'Extracted new build'
"

echo "=== [5/6] Restoring config and userlib ==="
ssh "$SERVER" "
  cp -f /tmp/camunda-default.yml $REMOTE_DIR/configuration/default.yml
  cp -af /tmp/camunda-userlib/* $REMOTE_DIR/configuration/userlib/
  rm -f /tmp/camunda-default.yml
  rm -rf /tmp/camunda-userlib
  chown -R camunda:camunda $REMOTE_DIR
  chmod +x $REMOTE_DIR/start.sh $REMOTE_DIR/shutdown.sh $REMOTE_DIR/internal/run.sh
  echo 'Config and userlib restored'
"

echo "=== [6/6] Starting Camunda ==="
ssh "$SERVER" "
  rm -f $REMOTE_DIR/internal/run.pid
  systemctl reset-failed camunda 2>/dev/null || true
  systemctl start camunda
  sleep 20
  systemctl is-active camunda && echo 'Service: RUNNING' || echo 'Service: FAILED'
  curl -sf http://localhost:8080/engine-rest/engine && echo '' && echo 'REST API: OK' || echo 'REST API: FAILED'
"

echo "=== Deploy complete ==="
