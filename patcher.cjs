const fs = require('fs');
let content = fs.readFileSync('C:\\Users\\UMAR ALI\\.gemini\\antigravity-ide\\brain\\eb8c855c-6826-4857-bc9b-b6fa64d325c2\\scratch\\LubePOS_backup.tsx', 'utf-8');
content = content.replace(/\r\n/g, '\n');

const startIdx = content.indexOf('const filteredProducts = useMemo');
let updated = content.substring(0, startIdx);

updated += `  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [rateCardType, setRateCardType] = useState<'retail' | 'wholesale'>('retail');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    sellableProducts.forEach(p => {
      if (p.category) cats.add(p.category);
      else if (p.type) cats.add(p.type);
    });
    return ['All', ...Array.from(cats)];
  }, [sellableProducts]);

  const filteredProducts = useMemo(() => {
    let result = sellableProducts;
    if (activeCategory !== 'All') {
      result = result.filter(p => p.type === activeCategory || p.category === activeCategory);
    }
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((product) => {
        return (
          product.name.toLowerCase().includes(query) ||
          product.urduName.includes(searchQuery)
        );
      });
    }
    return result;
  }, [searchQuery, sellableProducts, activeCategory]);

`;

const endIdx = content.indexOf('const cartItems = useMemo');
const rest = content.substring(endIdx);

const splitMarker = '      ) : (\n      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr]">';
const splitIdx = rest.indexOf(splitMarker);

if(splitIdx === -1) {
  console.log('Split marker not found');
  process.exit(1);
}

const finalRest = rest.substring(0, splitIdx - 1);
const newUI = fs.readFileSync('new_ui.txt', 'utf-8');

fs.writeFileSync('src/components/features/LubePOS.tsx', updated + finalRest + newUI, 'utf-8');
console.log('Successfully applied patch!');
