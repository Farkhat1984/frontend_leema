#!/bin/bash
# Добавляет navigation.js на все страницы admin, shop и user

cd /var/www/frontend_leema

# Находим все index.html файлы
find admin shop user -name "index.html" -type f ! -path "*/node_modules/*" | while read file; do
    # Проверяем, есть ли уже navigation.js
    if grep -q "navigation.js" "$file"; then
        echo "✓ $file - уже содержит navigation.js"
    else
        # Проверяем, есть ли блок скриптов
        if grep -q "common-utils.js" "$file"; then
            # Добавляем navigation.js после common-utils.js
            sed -i 's|\(.*common-utils\.js.*\)|\1\n    <script defer src="../../assets/js/shared/navigation.js?v=1001"></script>|' "$file"
            echo "✓ $file - navigation.js добавлен"
        else
            echo "⚠ $file - не найден common-utils.js"
        fi
    fi
done

echo ""
echo "Готово! Navigation.js добавлен на все страницы."
