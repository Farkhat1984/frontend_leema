#!/bin/bash
# Добавляет кнопку "Вернуться на главную" вручную на страницы

cd /var/www/frontend_leema

# Список файлов для обработки
files=(
    "admin/analytics/index.html"
    "admin/notifications/index.html"
    "admin/refunds/index.html"
    "admin/reports/index.html"
    "admin/reviews/index.html"
)

back_button='        <!-- Back Button -->
        <div class="mb-6">
            <a href="\/admin\/index.html" class="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium transition-colors group">
                <i class="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"><\/i>
                <span>Вернуться на главную<\/span>
            <\/a>
        <\/div>

'

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        # Проверяем, нет ли уже кнопки
        if grep -q "Back Button\|Назад к панели\|Вернуться на главную" "$file"; then
            echo "✓ $file - уже содержит кнопку"
        else
            # Ищем место после alertContainer или в начале контента
            if grep -q "alertContainer" "$file"; then
                # Вставляем после alertContainer
                sed -i "/alertContainer.*<\/div>/a\\
$back_button" "$file"
                echo "✓ $file - кнопка добавлена после alertContainer"
            elif grep -q "<!-- Main Content -->" "$file"; then
                # Вставляем после Main Content
                sed -i "/<!-- Main Content -->/,/<div class=\"max-w-7xl/a\\
$back_button" "$file"
                echo "✓ $file - кнопка добавлена после Main Content"
            elif grep -q "<!-- Header -->" "$file"; then
                # Вставляем перед Header
                sed -i "/<!-- Header -->/i\\
$back_button" "$file"
                echo "✓ $file - кнопка добавлена перед Header"
            else
                echo "⚠ $file - не найдено подходящее место"
            fi
        fi
    else
        echo "✗ $file - файл не найден"
    fi
done

echo ""
echo "Готово!"
