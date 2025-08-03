const fs = require('fs');
const path = require('path');

function scanAPIs(basePath = './src/api') {
    const categories = [];
    
    // Read all category folders
    const categoryFolders = fs.readdirSync(basePath).filter(f => 
        fs.statSync(path.join(basePath, f)).isDirectory()
    );

    categoryFolders.forEach(category => {
        const categoryPath = path.join(basePath, category);
        const apiFiles = fs.readdirSync(categoryPath)
            .filter(f => f.endsWith('.js'))
            .map(f => {
                // Extract API info from filename
                const name = f.replace('.js', '')
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                return {
                    name: name,
                    path: `/api/${category}/${f.replace('.js', '')}`,
                    desc: getDescriptionFromFile(path.join(categoryPath, f))
                };
            });

        if (apiFiles.length > 0) {
            categories.push({
                name: category.toUpperCase(),
                items: apiFiles
            });
        }
    });

    return { categories };
}

function getDescriptionFromFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Extract description from comment (first JS doc comment)
        const descMatch = content.match(/\/\*\*[\s\*]+([^*]+)/);
        return descMatch ? descMatch[1].trim() : 'API endpoint';
    } catch {
        return 'API endpoint';
    }
}

// Example Express endpoint
// app.get('/api/list', (req, res) => {
//     res.json(scanAPIs());
// });

module.exports = scanAPIs;
