// Завершение упражнения с дорожкой
function completePathExercise() {
    if (exerciseCompleted) return;
    
    // ПРОВЕРКА ПРОХОЖДЕНИЯ: для спирали разрешаем несколько ошибок, для остальных - строго
    let allowedErrors = 0;
    
    if (currentExercise && currentExercise.type === 'path-spiral') {
        allowedErrors = 3;
    }
    
    if (exitCount <= allowedErrors) {
        // ✅ УСПЕШНОЕ ПРОХОЖДЕНИЕ (не слишком много ошибок)
        
        if (totalSubTasks > 0) {
            // Упражнение с подзадачами
            const lastPoint = userPath[userPath.length - 1];
            let completedLine = -1;
            let minDistance = Infinity;
            
            // === Код определения completedLine (без изменений) ===
            if (currentExercise.type === 'path-lines') {
                const linePositions = [0.15, 0.3, 0.45, 0.6, 0.85];
                const lineLength = canvas.height * 0.3;
                const startY = canvas.height * 0.35;
                
                for (let i = 0; i < totalSubTasks; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const lineX = canvas.width * linePositions[i];
                        const finishY = startY + lineLength;
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - lineX, 2) + 
                            Math.pow(lastPoint.y - finishY, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i;
                        }
                    }
                }
            } else if (currentExercise.type === 'path-diagonal') {
                const linePositions = [0.2, 0.4, 0.6, 0.8];
                const lineLength = canvas.height * 0.1;
                const topY = canvas.height * 0.4;
                const bottomY = canvas.height * 0.55;
                const diagonalOffset = canvas.width * 0.05;
                
                for (let i = 0; i < 4; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const x2 = canvas.width * linePositions[i] + diagonalOffset;
                        const y2 = topY + lineLength;
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - x2, 2) + 
                            Math.pow(lastPoint.y - y2, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i;
                        }
                    }
                }
                
                for (let i = 0; i < 4; i++) {
                    if (!completedSubTasks.includes(i + 4)) {
                        const x2 = canvas.width * linePositions[i] - diagonalOffset;
                        const y2 = bottomY + lineLength;
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - x2, 2) + 
                            Math.pow(lastPoint.y - y2, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i + 4;
                        }
                    }
                }
            } else if (currentExercise.type === 'path-circles') {
                const radius = Math.min(28, canvas.width * 0.055);
                const leftX = canvas.width * 0.28;
                const rightX = canvas.width * 0.72;
                const topY = canvas.height * 0.25;
                const middleY = canvas.height * 0.5;
                const bottomY = canvas.height * 0.75;
                
                const circlePositions = [
                    { x: leftX, y: topY }, { x: leftX, y: middleY }, { x: leftX, y: bottomY },
                    { x: rightX, y: topY }, { x: rightX, y: middleY }, { x: rightX, y: bottomY }
                ];
                
                for (let i = 0; i < totalSubTasks; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const cx = circlePositions[i].x;
                        const cy = circlePositions[i].y;
                        const startY = cy - radius;
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - cx, 2) + 
                            Math.pow(lastPoint.y - startY, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i;
                        }
                    }
                }
            } else if (currentExercise.type === 'path-arcs') {
                const radius = Math.min(32, canvas.width * 0.065);
                const centerX = canvas.width * 0.5;
                const yPositions = [canvas.height * 0.18, canvas.height * 0.33, canvas.height * 0.5, canvas.height * 0.67, canvas.height * 0.82];
                
                for (let i = 0; i < 5; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const cy = yPositions[i];
                        const endX_point = centerX + radius;
                        const endY_point = cy;
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - endX_point, 2) + 
                            Math.pow(lastPoint.y - endY_point, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i;
                        }
                    }
                }
            } else if (currentExercise.type === 'path-loops') {
                const waveWidth = Math.min(200, canvas.width * 0.6);
                const waveHeight = Math.min(40, canvas.height * 0.08);
                const wavesPerLine = 2.5;
                const startX = (canvas.width - waveWidth) / 2;
                const yPositions = [canvas.height * 0.25, canvas.height * 0.5, canvas.height * 0.75];
                
                for (let i = 0; i < totalSubTasks; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const centerY = yPositions[i];
                        const waveEndX = startX + waveWidth;
                        const finalAngle = wavesPerLine * Math.PI * 2;
                        const endY = centerY + Math.sin(finalAngle) * waveHeight / 2;
                        
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - waveEndX, 2) + 
                            Math.pow(lastPoint.y - endY, 2)
                        );
                        
                        if (distance < minDistance && distance <= 40) {
                            minDistance = distance;
                            completedLine = i;
                        }
                    }
                }
            }
            // === Конец кода определения completedLine ===
            
            // Обработка, если нашли завершённую линию
            if (completedLine !== -1) {
                completedSubTasks.push(completedLine);
                const feedback = document.getElementById('feedback');
                
                if (completedSubTasks.length >= totalSubTasks) {
                    // Все линии завершены
                    exerciseCompleted = true;
                    isDrawing = false;
                    feedback.textContent = `🎉 Идеально! Все ${totalSubTasks} линии выполнены!`;
                    feedback.className = 'feedback';
                    feedback.classList.remove('hidden');
                    
                    setTimeout(() => {
                        nextExercise();
                    }, 1500);
                } else {
                    // Ещё есть незавершённые линии
                    feedback.textContent = `✓ Отлично! Линия ${completedSubTasks.length} из ${totalSubTasks}. Проведи остальные!`;
                    feedback.className = 'feedback';
                    feedback.classList.remove('hidden');
                    
                    setTimeout(() => {
                        clearCanvas();
                        drawExerciseTemplate(currentExercise);
                        feedback.classList.add('hidden');
                        userPath = [];
                        exitCount = 0;
                        isOutOfBounds = false;
                    }, 1500);
                }
            }
            // Если completedLine === -1, просто ждём, пока пользователь дойдёт до финиша
        } else {
            // Обычное упражнение без подзадач
            exerciseCompleted = true;
            isDrawing = false;
            
            drawFinishMark();
            
            const feedback = document.getElementById('feedback');
            
            if (currentExercise && currentExercise.type === 'path-spiral') {
                if (exitCount === 0) {
                    feedback.textContent = '🎉 Идеально! Переход к следующему уровню!';
                } else {
                    feedback.textContent = `✅ Отлично! ${exitCount} касаний границ (до 3 разрешено)`;
                }
            } else {
                feedback.textContent = '🎉 Идеально! Переход к следующему уровню!';
            }
            
            feedback.className = 'feedback';
            feedback.classList.remove('hidden');
            
            setTimeout(() => {
                nextExercise();
            }, 1500);
        }
    } else {
        // ❌ ОШИБКА: слишком много выходов за границы (exitCount > allowedErrors)
        isDrawing = false;
        
        const feedback = document.getElementById('feedback');
        
        if (currentExercise && currentExercise.type === 'path-spiral') {
            feedback.textContent = `⚠️ Слишком много касаний границ (${exitCount}/3). Попробуй аккуратнее!`;
        } else {
            feedback.textContent = '⚠️ Были выходы за границы. Попробуй еще раз!';
        }
        
        feedback.className = 'feedback error';
        feedback.classList.remove('hidden');
        
        setTimeout(() => {
            clearCanvas();
            drawExerciseTemplate(currentExercise);
            feedback.classList.add('hidden');
            userPath = [];
            exitCount = 0;
            isOutOfBounds = false;
        }, 1500);
    }
}
