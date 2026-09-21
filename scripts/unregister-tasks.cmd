@echo off
schtasks /Delete /F /TN "MathArena Morning"
schtasks /Delete /F /TN "MathArena Evening"
schtasks /Delete /F /TN "MathArena Digest"
