#!/bin/bash
# Добавляет navigation.js на все страницы admin, shop и user

cd /var/www/frontend_leema

# Находим все index.html файлы
find admin shop user -name "index.html" -type f ! -path "*/node_modules/*" | while read file; do
    # Проверяем, есть ли уже navigation.js
    if grep -q "navigation.js" "$file"; then
        echo "✓ $file - уже содержит navigation.js"
    else
        # Находим последний скрипт перед </body>
        if grep -q "</body>" "$file"; then
            # Добавляем navigation.js перед </body>
            sed -i 's|</body>|    <script defer src="../../assets/js/shared/navigation.js?v=1001"></script>\n</body>|' "$file"
            echo "✓ $file - navigation.js добавлен"
        else
            echo "⚠ $file - не найден </body>"
        fi
    fi
done

echo ""
echo "Готово! Navigation.js добавлен на все страницы."
