import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wheat, 
  Carrot, 
  Apple, 
  Egg, 
  Milk, 
  Droplet, 
  Cookie, 
  Sparkles, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Calendar, 
  CheckCircle2, 
  Info, 
  Utensils, 
  Zap,
  Check,
  X,
  Flame
} from 'lucide-react';

// Weigh-Less 7 Core Categories with Target Limits and Colors
const CATEGORIES = {
  carbs: { name: 'Complex Carbs', limit: 5, color: 'bg-amber-500', lightColor: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Wheat, example: 'Wholewheat bread, oats, brown rice' },
  veg: { name: 'Vegetables', limit: 3, color: 'bg-emerald-500', lightColor: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: Carrot, example: 'Spinach, broccoli, lettuce, tomatoes' },
  fruit: { name: 'Fruits', limit: 2, color: 'bg-rose-500', lightColor: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: Apple, example: 'Apple, berries, small banana' },
  protein: { name: 'Proteins', limit: 3, color: 'bg-indigo-500', lightColor: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', icon: Egg, example: 'Chicken breast, biltong, egg, hake' },
  milk: { name: 'Milk / Dairy', limit: 2, color: 'bg-sky-500', lightColor: 'bg-sky-50 border-sky-200', text: 'text-sky-700', icon: Milk, example: 'Fat-free milk, fat-free cottage cheese, plain yogurt' },
  fats: { name: 'Fats & Oils', limit: 3, color: 'bg-yellow-500', lightColor: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: Droplet, example: 'Avocado, light margarine, olive oil, almonds' },
  treats: { name: 'Treats / Condiments', limit: 3, color: 'bg-purple-500', lightColor: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: Cookie, example: 'Sweet chilli sauce, sugar-free jelly, dark chocolate' }
};

// Quick Food Presets
const QUICK_PRESETS = [
  { name: 'Low GI Bread (1 slice)', slot: 'Breakfast', portions: { carbs: 1 } },
  { name: 'Ryvita Crispbread (2 slices)', slot: 'Snack', portions: { carbs: 1 } },
  { name: 'Lean Biltong / Beef Jerky (30g)', slot: 'Snack', portions: { protein: 1 } },
  { name: 'Grilled Hake Fillet (150g)', slot: 'Dinner', portions: { protein: 2 } },
  { name: 'Low Fat Pork Banger (2)', slot: 'Dinner', portions: { protein: 1, fats: 1 } },
  { name: 'Light Spread (10g / 2 tsp)', slot: 'Breakfast', portions: { fats: 1 } },
  { name: 'Fat Free Smooth Cottage Cheese (100g)', slot: 'Lunch', portions: { milk: 1 } },
  { name: 'Medium Avocado (1/4 slice)', slot: 'Lunch', portions: { fats: 1 } },
  { name: 'Sweet Chilli Sauce (1 tbsp / 15ml)', slot: 'Dinner', portions: { treats: 1 } },
  { name: 'Low Fat Cheddar Cheese (30g)', slot: 'Lunch', portions: { protein: 1 } }
];

// Quick Meal Templates
const MEAL_TEMPLATES = [
  {
    name: 'Ham & Cheese Toastie',
    slot: 'Lunch',
    description: '2 brown bread slices, 30g low fat ham, 30g low fat cheese, 1 tsp light spread',
    portions: { carbs: 2, protein: 2, fats: 1 }
  },
  {
    name: 'Greek Yogurt & Berry Morning Bowl',
    slot: 'Breakfast',
    description: '40g rolled oats, 150g fat-free Greek yogurt, 1/2 cup fresh berries, 1 tsp honey',
    portions: { carbs: 1, milk: 1, fruit: 1, treats: 0.5 }
  },
  {
    name: 'Grab & Go Lean Beef Salad',
    slot: 'Lunch',
    description: 'Mixed salad greens, cherry tomatoes, 30g lean biltong, 1/4 avocado, 1 tbsp sweet chilli dressing',
    portions: { veg: 2, protein: 1, fats: 1, treats: 1 }
  },
  {
    name: 'Sheet Pan Hake & Veggie Supper',
    slot: 'Dinner',
    description: '150g pan-roasted Hake fillet, 1 medium sweet potato, roasted baby marrow & peppers, 1 tsp olive oil',
    portions: { protein: 2, carbs: 1, veg: 2, fats: 1 }
  }
];

export default function App() {
  // Today's Date String YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Storage for Logged Items keyed by date string
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('weigh_less_logs');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to load logs', e);
      return {};
    }
  });

  // State for AI Natural Language Input
  const [mealInput, setMealInput] = useState('');
  const [mealSlot, setMealSlot] = useState('Lunch');
  const [isParsing, setIsParsing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // State for Breakdown Review Modal
  const [breakdownModal, setBreakdownModal] = useState(null); // { name, slot, portions, isAiGenerated, reasoning }

  // Save logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('weigh_less_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs', e);
    }
  }, [logs]);

  // Current Day Logged Items
  const currentDayItems = useMemo(() => {
    return logs[selectedDate] || [];
  }, [logs, selectedDate]);

  // Calculate totals per category for selected date
  const categoryTotals = useMemo(() => {
    const totals = { carbs: 0, veg: 0, fruit: 0, protein: 0, milk: 0, fats: 0, treats: 0 };
    currentDayItems.forEach(item => {
      Object.entries(item.portions || {}).forEach(([cat, count]) => {
        if (totals[cat] !== undefined) {
          totals[cat] += Number(count) || 0;
        }
      });
    });
    return totals;
  }, [currentDayItems]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Offline / Fallback Rule-Based Parser
  const parseMealRuleBased = (text) => {
    const lower = text.toLowerCase();
    const portions = { carbs: 0, veg: 0, fruit: 0, protein: 0, milk: 0, fats: 0, treats: 0 };
    
    // Bread & Sandwiches
    if (lower.includes('sandwich') || lower.includes('toastie')) {
      portions.carbs += 2; // Usually 2 slices
      if (lower.includes('ham') || lower.includes('chicken') || lower.includes('beef') || lower.includes('tuna') || lower.includes('egg')) portions.protein += 1;
      if (lower.includes('cheese')) { portions.protein += 1; portions.fats += 0.5; }
      if (lower.includes('butter') || lower.includes('marge') || lower.includes('mayo') || lower.includes('spread')) portions.fats += 1;
      if (lower.includes('tomato') || lower.includes('lettuce') || lower.includes('cucumber')) portions.veg += 0.5;
    } 
    // Oats / Porridge / Breakfast
    else if (lower.includes('oat') || lower.includes('oatmeal') || lower.includes('porridge')) {
      portions.carbs += 1;
      if (lower.includes('milk')) portions.milk += 0.5;
      if (lower.includes('yogurt') || lower.includes('yoghurt')) portions.milk += 1;
      if (lower.includes('berry') || lower.includes('berries') || lower.includes('banana') || lower.includes('apple')) portions.fruit += 1;
      if (lower.includes('honey') || lower.includes('sugar') || lower.includes('syrup')) portions.treats += 0.5;
      if (lower.includes('nuts') || lower.includes('peanut butter') || lower.includes('almond')) portions.fats += 1;
    }
    // Salad
    else if (lower.includes('salad')) {
      portions.veg += 2;
      if (lower.includes('biltong')) portions.protein += 1;
      if (lower.includes('chicken') || lower.includes('tuna') || lower.includes('feta') || lower.includes('egg')) portions.protein += 1;
      if (lower.includes('avocado') || lower.includes('avo') || lower.includes('olive oil') || lower.includes('dressing')) portions.fats += 1;
      if (lower.includes('sweet chilli') || lower.includes('sauce')) portions.treats += 1;
    } 
    // Generic fallback keyword detection
    else {
      if (lower.includes('bread') || lower.includes('rice') || lower.includes('potato') || lower.includes('pasta') || lower.includes('wrap') || lower.includes('ryvita')) portions.carbs += 1;
      if (lower.includes('biltong') || lower.includes('chicken') || lower.includes('steak') || lower.includes('hake') || lower.includes('fish') || lower.includes('egg') || lower.includes('banger') || lower.includes('pork')) portions.protein += 1;
      if (lower.includes('spinach') || lower.includes('broccoli') || lower.includes('tomato') || lower.includes('vegetable') || lower.includes('veg')) portions.veg += 1;
      if (lower.includes('apple') || lower.includes('banana') || lower.includes('orange') || lower.includes('fruit') || lower.includes('berries')) portions.fruit += 1;
      if (lower.includes('milk') || lower.includes('cottage cheese') || lower.includes('cheese') || lower.includes('yogurt') || lower.includes('yoghurt')) portions.milk += 1;
      if (lower.includes('butter') || lower.includes('oil') || lower.includes('avocado') || lower.includes('avo') || lower.includes('nuts')) portions.fats += 1;
      if (lower.includes('chilli') || lower.includes('treat') || lower.includes('chocolate') || lower.includes('sugar') || lower.includes('sauce')) portions.treats += 1;
    }

    // Default at least 1 carb/protein if empty
    if (Object.values(portions).reduce((a, b) => a + b, 0) === 0) {
      portions.carbs = 1;
    }

    return portions;
  };

  // Call Gemini API via generateContent REST endpoint or fallback
  const handleParseMeal = async (e) => {
    e?.preventDefault();
    if (!mealInput.trim()) return;

    setIsParsing(true);

    const promptText = `You are an expert dietitian assistant.
Deconstruct the following meal description into estimated Weigh-Less portions across 7 standard categories:
- carbs (Complex Carbs: bread, rice, oats, starch)
- veg (Vegetables)
- fruit (Fruits)
- protein (Proteins: meat, biltong, fish, eggs, low fat cheese)
- milk (Milk/Dairy: fat-free milk, yogurt, cottage cheese)
- fats (Fats & Oils: avocado, butter/spread, olive oil, nuts)
- treats (Treats & Condiments: sweet chilli, honey, sugar, chocolate)

Meal Description: "${mealInput}"

Return ONLY a JSON object with portion numbers (can be decimals like 0.5, 1, 1.5, 2) matching this exact format:
{
  "carbs": number,
  "veg": number,
  "fruit": number,
  "protein": number,
  "milk": number,
  "fats": number,
  "treats": number,
  "reasoning": "Brief 1-sentence breakdown explanation for the user"
}`;

    try {
      const apiKey = process.env.GEMINI_API_KEY || "";
      let portions = null;
      let reasoning = "";

      if (apiKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            portions = {
              carbs: Number(parsed.carbs) || 0,
              veg: Number(parsed.veg) || 0,
              fruit: Number(parsed.fruit) || 0,
              protein: Number(parsed.protein) || 0,
              milk: Number(parsed.milk) || 0,
              fats: Number(parsed.fats) || 0,
              treats: Number(parsed.treats) || 0
            };
            reasoning = parsed.reasoning || "Intelligently deconstructed using Gemini AI";
          }
        }
      }

      // If no API key or API call failed, fall back gracefully to rule-based engine
      if (!portions) {
        portions = parseMealRuleBased(mealInput);
        reasoning = "Deconstructed using Smart Parser Rules.";
      }

      setBreakdownModal({
        name: mealInput,
        slot: mealSlot,
        portions,
        reasoning,
        isAiGenerated: true
      });

    } catch (err) {
      console.warn("AI parsing error, falling back to smart rule parser:", err);
      const portions = parseMealRuleBased(mealInput);
      setBreakdownModal({
        name: mealInput,
        slot: mealSlot,
        portions,
        reasoning: "Deconstructed using Smart Parser Rules.",
        isAiGenerated: false
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Confirm and Add Item to Log
  const confirmAddItem = (itemToAdd) => {
    const newItem = {
      id: Date.now().toString(),
      name: itemToAdd.name,
      slot: itemToAdd.slot || mealSlot,
      portions: itemToAdd.portions,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setLogs(prev => {
      const dayList = prev[selectedDate] || [];
      return {
        ...prev,
        [selectedDate]: [...dayList, newItem]
      };
    });

    setMealInput('');
    setBreakdownModal(null);
    showToast(`Added "${newItem.name}" to ${newItem.slot}!`);
  };

  // Quick Add Preset Item
  const handleQuickAdd = (preset) => {
    setBreakdownModal({
      name: preset.name,
      slot: preset.slot,
      portions: { carbs: 0, veg: 0, fruit: 0, protein: 0, milk: 0, fats: 0, treats: 0, ...preset.portions },
      reasoning: "Standard Preset Portion",
      isAiGenerated: false
    });
  };

  // Remove single item
  const handleRemoveItem = (id) => {
    setLogs(prev => {
      const dayList = prev[selectedDate] || [];
      return {
        ...prev,
        [selectedDate]: dayList.filter(item => item.id !== id)
      };
    });
    showToast("Item removed from log.");
  };

  // Clear day log
  const handleClearDay = () => {
    setLogs(prev => ({
      ...prev,
      [selectedDate]: []
    }));
    showToast("Cleared all meals for selected day.");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 animate-bounce text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Flame className="w-7 h-7 text-amber-300" />
                <h1 className="text-2xl font-black tracking-tight">Weigh-Less Daily Tracker</h1>
              </div>
              <p className="text-emerald-100 text-sm mt-0.5">
                Smart Daily Portion Allowance & AI Natural Meal Parser
              </p>
            </div>

            {/* Date Picker Selector */}
            <div className="flex items-center bg-emerald-800/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-emerald-600/50 shadow-inner">
              <Calendar className="w-4 h-4 text-emerald-200 mr-2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-medium text-sm outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Smart Parser & Log (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AI Natural Language Meal Parser Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Smart AI Meal Parser</h2>
                  <p className="text-xs text-slate-500">Describe what you ate in plain English</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full flex items-center">
                <Zap className="w-3 h-3 mr-1 text-amber-600 fill-amber-500" /> Portion AI
              </span>
            </div>

            <form onSubmit={handleParseMeal} className="space-y-4">
              <div>
                <textarea
                  value={mealInput}
                  onChange={(e) => setMealInput(e.target.value)}
                  placeholder="e.g. ham & cheese wholewheat sandwich with light spread, or 2 ryvitas with fat free cottage cheese and sweet chilli"
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200 transition-all text-sm outline-none resize-none h-24"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <label className="text-xs font-medium text-slate-600">Meal Slot:</label>
                  <select
                    value={mealSlot}
                    onChange={(e) => setMealSlot(e.target.value)}
                    className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 font-medium outline-none focus:border-emerald-500"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isParsing || !mealInput.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isParsing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deconstructing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Deconstruct & Log Meal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Presets */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
              <Zap className="w-4 h-4 mr-1 text-amber-500" /> Quick Presets
            </h3>
            <div className="flex flex-wrap gap-2">
              {QUICK_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAdd(preset)}
                  className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center space-x-1"
                >
                  <span>{preset.name}</span>
                  <Plus className="w-3 h-3 text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Meal Templates */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
              <Utensils className="w-4 h-4 mr-1.5 text-emerald-600" /> 1-Click Meal Templates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MEAL_TEMPLATES.map((tmpl, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleQuickAdd(tmpl)}
                  className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-200 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 group-hover:text-emerald-800">{tmpl.name}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md">{tmpl.slot}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{tmpl.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(tmpl.portions).map(([cat, val]) => (
                      <span key={cat} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORIES[cat]?.lightColor} ${CATEGORIES[cat]?.text}`}>
                        {val} {CATEGORIES[cat]?.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Logged Meals Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Logged Meals for {selectedDate}</h3>
                <p className="text-xs text-slate-500">{currentDayItems.length} items logged today</p>
              </div>
              {currentDayItems.length > 0 && (
                <button
                  onClick={handleClearDay}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center space-x-1 font-medium bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Day</span>
                </button>
              )}
            </div>

            {currentDayItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Utensils className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No meals logged for this date yet.</p>
                <p className="text-xs text-slate-400 mt-1">Use the AI parser above or click a quick preset to start!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(slot => {
                  const slotItems = currentDayItems.filter(item => item.slot === slot);
                  if (slotItems.length === 0) return null;

                  return (
                    <div key={slot} className="border-b border-slate-100 pb-3 last:border-none last:pb-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                        {slot}
                      </span>
                      <div className="space-y-2">
                        {slotItems.map(item => (
                          <div key={item.id} className="flex items-start justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-sm text-slate-800">{item.name}</span>
                                <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(item.portions).map(([cat, val]) => {
                                  if (!val || val === 0) return null;
                                  const catInfo = CATEGORIES[cat];
                                  return (
                                    <span 
                                      key={cat} 
                                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${catInfo?.lightColor} ${catInfo?.text} border`}
                                    >
                                      +{val} {catInfo?.name}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Daily Allowance Progress Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Daily Allowances</h2>
              <span className="text-xs text-slate-500 font-medium">Standard Target</span>
            </div>

            {/* Category Cards */}
            <div className="space-y-3">
              {Object.entries(CATEGORIES).map(([catKey, cat]) => {
                const used = categoryTotals[catKey] || 0;
                const remaining = Math.max(0, cat.limit - used);
                const percent = Math.min(100, Math.round((used / cat.limit) * 100));
                const isOver = used > cat.limit;
                const IconComponent = cat.icon;

                return (
                  <div 
                    key={catKey} 
                    className={`p-3.5 rounded-xl border transition-all ${
                      isOver 
                        ? 'bg-rose-50 border-rose-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${cat.color} text-white`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-800">{cat.name}</span>
                          <span className="text-[10px] text-slate-400 block -mt-0.5">{cat.example}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black">
                          <span className={isOver ? 'text-rose-600 font-extrabold' : 'text-slate-800'}>
                            {used}
                          </span>
                          <span className="text-slate-400 font-normal"> / {cat.limit}</span>
                        </div>
                        <span className={`text-[10px] font-medium ${isOver ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                          {isOver ? `${(used - cat.limit).toFixed(1)} over limit!` : `${remaining.toFixed(1)} left`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : cat.color
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weigh-Less Quick Rules Reference */}
          <div className="bg-emerald-900 text-white rounded-2xl shadow-sm p-5 space-y-3">
            <div className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-emerald-300" />
              <h4 className="font-bold text-sm">Weigh-Less Quick Rules</h4>
            </div>
            <ul className="text-xs text-emerald-100 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Drink at least 2L of water daily.</li>
              <li>Include at least 3 Vegetable portions daily for fiber.</li>
              <li>Limit treats & condiments to 3 portions maximum.</li>
              <li>Fat-free dairy ensures high calcium with controlled fat.</li>
            </ul>
          </div>
        </div>

      </main>

      {/* Breakdown / Confirmation Review Modal */}
      {breakdownModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Review Portion Breakdown</h3>
                <p className="text-xs text-slate-500">{breakdownModal.name}</p>
              </div>
              <button 
                onClick={() => setBreakdownModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {breakdownModal.reasoning && (
              <p className="text-xs italic bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100">
                "{breakdownModal.reasoning}"
              </p>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adjust Portions if needed:</p>
              {Object.entries(CATEGORIES).map(([catKey, cat]) => {
                const val = breakdownModal.portions[catKey] || 0;
                return (
                  <div key={catKey} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700">{cat.name}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setBreakdownModal(prev => ({
                            ...prev,
                            portions: {
                              ...prev.portions,
                              [catKey]: Math.max(0, (prev.portions[catKey] || 0) - 0.5)
                            }
                          }));
                        }}
                        className="w-6 h-6 rounded-md bg-white border border-slate-300 font-bold text-xs flex items-center justify-center hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-6 text-center">{val}</span>
                      <button
                        onClick={() => {
                          setBreakdownModal(prev => ({
                            ...prev,
                            portions: {
                              ...prev.portions,
                              [catKey]: (prev.portions[catKey] || 0) + 0.5
                            }
                          }));
                        }}
                        className="w-6 h-6 rounded-md bg-white border border-slate-300 font-bold text-xs flex items-center justify-center hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setBreakdownModal(null)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmAddItem(breakdownModal)}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Log</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}