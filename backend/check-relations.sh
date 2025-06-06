# backend/check-relations.sh
#!/bin/bash

echo "🔍 Verificando relaciones duplicadas en Sequelize..."
echo ""

echo "📁 Buscando hasMany en archivos:"
grep -rn "hasMany" src/ scripts/ 2>/dev/null || echo "   No encontrado"

echo ""
echo "📁 Buscando belongsTo en archivos:"
grep -rn "belongsTo" src/ scripts/ 2>/dev/null || echo "   No encontrado"

echo ""
echo "📁 Buscando alias 'businesses':"
grep -rn "as.*businesses" src/ scripts/ 2>/dev/null || echo "   No encontrado"

echo ""
echo "📁 Buscando alias 'creator':"
grep -rn "as.*creator" src/ scripts/ 2>/dev/null || echo "   No encontrado"

echo ""
echo "✅ Verificación completada"
echo "💡 Las relaciones deben estar SOLO en src/server.js"