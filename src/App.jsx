import { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, ChevronLeft, Circle, CheckCircle, Plus, Trash2, Edit3, Save, 
  ShoppingCart, Search, Filter, Moon, Sun, Mic, MicOff, Bell, BellOff,
  FolderPlus, Settings, DollarSign, Tag, Clock, Star, Menu, X
} from 'lucide-react';

const App = () => {
  // Local Storage Keys
  const STORAGE_KEYS = {
    LISTS: 'shopping_lists',
    CURRENT_LIST_ID: 'current_list_id',
    SETTINGS: 'shopping_app_settings'
  };

  // Load data from localStorage
  const loadFromStorage = () => {
    try {
      const savedLists = localStorage.getItem(STORAGE_KEYS.LISTS);
      const savedCurrentListId = localStorage.getItem(STORAGE_KEYS.CURRENT_LIST_ID);
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      const defaultLists = {
        'default': {
          id: 'default',
          name: 'My Shopping List',
          items: [],
          createdAt: Date.now()
        }
      };

      const lists = savedLists ? JSON.parse(savedLists) : defaultLists;
      const currentListId = savedCurrentListId || 'default';
      const settings = savedSettings ? JSON.parse(savedSettings) : {
        darkMode: false,
        notificationsEnabled: false,
        showCompleted: true
      };

      return { lists, currentListId, settings };
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return {
        lists: {
          'default': {
            id: 'default',
            name: 'My Shopping List',
            items: [],
            createdAt: Date.now()
          }
        },
        currentListId: 'default',
        settings: {
          darkMode: false,
          notificationsEnabled: false,
          showCompleted: true
        }
      };
    }
  };

  // Initialize state with data from localStorage
  const { lists: initialLists, currentListId: initialCurrentListId, settings: initialSettings } = loadFromStorage();

  // Core State
  const [currentListId, setCurrentListId] = useState(initialCurrentListId);
  const [lists, setLists] = useState(initialLists);
  
  // UI State
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCompleted, setShowCompleted] = useState(initialSettings.showCompleted);
  const [darkMode, setDarkMode] = useState(initialSettings.darkMode);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Voice & Notifications
  const [isListening, setIsListening] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialSettings.notificationsEnabled);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  
  // Smart Suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Save to localStorage functions
  const saveToStorage = {
    lists: (listsData) => {
      try {
        localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(listsData));
      } catch (error) {
        console.error('Error saving lists to localStorage:', error);
      }
    },
    currentListId: (listId) => {
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_LIST_ID, listId);
      } catch (error) {
        console.error('Error saving current list ID to localStorage:', error);
      }
    },
    settings: (settings) => {
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings to localStorage:', error);
      }
    }
  };

  // Auto-save lists when they change
  useEffect(() => {
    saveToStorage.lists(lists);
  }, [lists]);

  // Auto-save current list ID when it changes
  useEffect(() => {
    saveToStorage.currentListId(currentListId);
  }, [currentListId]);

  // Auto-save settings when they change
  useEffect(() => {
    const settings = {
      darkMode,
      notificationsEnabled,
      showCompleted
    };
    saveToStorage.settings(settings);
  }, [darkMode, notificationsEnabled, showCompleted]);

  // Categories with icons and colors
  const categories = {
    'all': { name: 'All Items', icon: '🛒', color: 'category-other' },
    'fruits': { name: 'Fruits & Vegetables', icon: '🍎', color: 'category-fruits' },
    'meat': { name: 'Meat & Seafood', icon: '🥩', color: 'category-meat' },
    'dairy': { name: 'Dairy & Eggs', icon: '🥛', color: 'category-dairy' },
    'bakery': { name: 'Bakery', icon: '🍞', color: 'category-bakery' },
    'pantry': { name: 'Pantry & Canned', icon: '🥫', color: 'category-pantry' },
    'frozen': { name: 'Frozen Foods', icon: '🧊', color: 'category-frozen' },
    'household': { name: 'Household', icon: '🧽', color: 'category-household' },
    'personal': { name: 'Personal Care', icon: '🧴', color: 'category-personal' },
    'other': { name: 'Other', icon: '📦', color: 'category-other' }
  };

  // Common items database for smart suggestions
  const commonItems = {
    'fruits': ['Apples', 'Bananas', 'Oranges', 'Strawberries', 'Grapes', 'Tomatoes', 'Carrots', 'Onions', 'Potatoes', 'Lettuce'],
    'meat': ['Chicken Breast', 'Ground Beef', 'Salmon', 'Bacon', 'Turkey', 'Pork Chops', 'Shrimp', 'Ham'],
    'dairy': ['Milk', 'Eggs', 'Cheese', 'Yogurt', 'Butter', 'Cream', 'Sour Cream'],
    'bakery': ['Bread', 'Bagels', 'Croissants', 'Muffins', 'Rolls', 'Cake'],
    'pantry': ['Rice', 'Pasta', 'Flour', 'Sugar', 'Salt', 'Oil', 'Vinegar', 'Canned Tomatoes', 'Beans'],
    'frozen': ['Ice Cream', 'Frozen Pizza', 'Frozen Vegetables', 'Frozen Berries'],
    'household': ['Paper Towels', 'Toilet Paper', 'Dish Soap', 'Laundry Detergent', 'Trash Bags'],
    'personal': ['Shampoo', 'Toothpaste', 'Soap', 'Deodorant', 'Lotion'],
    'other': ['Batteries', 'Light Bulbs', 'Phone Charger']
  };

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Smart suggestions based on input
  useEffect(() => {
    if (inputValue.length > 1) {
      const allItems = Object.values(commonItems).flat();
      const filtered = allItems.filter(item => 
        item.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  // Current list
  const currentList = lists[currentListId];
  const currentItems = currentList?.items || [];

  // Filtered items
  const filteredItems = currentItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesCompletion = showCompleted || !item.isSelected;
    return matchesSearch && matchesCategory && matchesCompletion;
  });

  // Statistics
  const totalItems = currentItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = currentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const completedItems = currentItems.filter(item => item.isSelected).length;

  // Add item function
  const handleAddItem = (itemName = inputValue, category = 'other') => {
    if (itemName.trim() === '') return;

    const newItem = {
      id: Date.now(),
      itemName: itemName.trim(),
      quantity: 1,
      price: 0,
      category: category,
      isSelected: false,
      isEditing: false,
      addedAt: Date.now()
    };

    const updatedItems = [...currentItems, newItem];
    setLists(prev => ({
      ...prev,
      [currentListId]: {
        ...prev[currentListId],
        items: updatedItems
      }
    }));
    
    setInputValue('');
    setShowSuggestions(false);
  };

  // Voice input
  const toggleVoiceInput = () => {
    if (!voiceSupported) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Create new list
  const createNewList = () => {
    const listName = prompt('Enter list name:');
    if (!listName) return;

    const newListId = Date.now().toString();
    const newList = {
      id: newListId,
      name: listName,
      items: [],
      createdAt: Date.now()
    };

    setLists(prev => ({ ...prev, [newListId]: newList }));
    setCurrentListId(newListId);
    setShowSidebar(false);
  };

  // Delete list
  const deleteList = (listId) => {
    if (Object.keys(lists).length === 1) return; // Don't delete the last list
    
    const updatedLists = { ...lists };
    delete updatedLists[listId];
    setLists(updatedLists);
    
    if (currentListId === listId) {
      setCurrentListId(Object.keys(updatedLists)[0]);
    }
  };

  // Clear all data (for settings/reset functionality)
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        localStorage.removeItem(STORAGE_KEYS.LISTS);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_LIST_ID);
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        
        // Reset to default state
        const defaultLists = {
          'default': {
            id: 'default',
            name: 'My Shopping List',
            items: [],
            createdAt: Date.now()
          }
        };
        
        setLists(defaultLists);
        setCurrentListId('default');
        setDarkMode(false);
        setNotificationsEnabled(false);
        setShowCompleted(true);
        
        alert('All data has been cleared successfully!');
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data. Please try again.');
      }
    }
  };

  // Export lists to JSON file
  const exportLists = () => {
    try {
      const dataToExport = {
        lists,
        currentListId,
        settings: {
          darkMode,
          notificationsEnabled,
          showCompleted
        },
        exportDate: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shopping-lists-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting lists:', error);
      alert('Error exporting lists. Please try again.');
    }
  };

  // Import lists from JSON file
  const importLists = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (importedData.lists && typeof importedData.lists === 'object') {
          setLists(importedData.lists);
          
          if (importedData.currentListId && importedData.lists[importedData.currentListId]) {
            setCurrentListId(importedData.currentListId);
          } else {
            setCurrentListId(Object.keys(importedData.lists)[0]);
          }
          
          if (importedData.settings) {
            setDarkMode(importedData.settings.darkMode || false);
            setNotificationsEnabled(importedData.settings.notificationsEnabled || false);
            setShowCompleted(importedData.settings.showCompleted !== false);
          }
          
          alert('Lists imported successfully!');
        } else {
          alert('Invalid file format. Please select a valid shopping lists export file.');
        }
      } catch (error) {
        console.error('Error importing lists:', error);
        alert('Error importing lists. Please check the file format and try again.');
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  // Toggle notifications
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    if (!notificationsEnabled && 'Notification' in window) {
      // Schedule a reminder (demo)
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('Shopping Reminder', {
            body: 'Don\'t forget to check your shopping list!',
            icon: '🛒'
          });
        }
      }, 5000);
    }
  };

  // Update item functions
  const updateItem = (itemId, updates) => {
    const updatedItems = currentItems.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    
    setLists(prev => ({
      ...prev,
      [currentListId]: {
        ...prev[currentListId],
        items: updatedItems
      }
    }));
  };

  const deleteItem = (itemId) => {
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    setLists(prev => ({
      ...prev,
      [currentListId]: {
        ...prev[currentListId],
        items: updatedItems
      }
    }));
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-theme' : ''}`}>
      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Your Lists</h2>
          <button className="icon-button" onClick={() => setShowSidebar(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="sidebar-content">
          <button onClick={createNewList} className="create-list-btn">
            <FolderPlus size={20} />
            Create New List
          </button>
        </div>

        <div className="lists-container">
          {Object.values(lists).map(list => (
            <div key={list.id} className="list-item">
              <button
                onClick={() => {
                  setCurrentListId(list.id);
                  setShowSidebar(false);
                }}
                className={`list-button ${currentListId === list.id ? 'active' : ''}`}
              >
                <div className="list-name">{list.name}</div>
                <div className="list-info">{list.items.length} items</div>
              </button>
              {Object.keys(lists).length > 1 && (
                <button
                  onClick={() => deleteList(list.id)}
                  className="delete-list-btn"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Overlay */}
      {showSidebar && (
        <div className="overlay" onClick={() => setShowSidebar(false)} />
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-controls">
            <button
              onClick={() => setShowSidebar(true)}
              className="icon-button"
            >
              <Menu size={24} />
            </button>
            
            <div className="header-controls-right">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="icon-button"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <button
                onClick={toggleNotifications}
                className={`icon-button ${notificationsEnabled ? 'active' : ''}`}
              >
                {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
              </button>
            </div>
          </div>

          <div className="app-icon">
            <ShoppingCart size={32} color="white" />
          </div>
          <h1 className="app-title">
            {currentList?.name || 'Shopping List'}
          </h1>
          <div className="header-stats">
            <span>{totalItems} items</span>
            <span>•</span>
            <span>${totalCost.toFixed(2)}</span>
            <span>•</span>
            <span>{completedItems} completed</span>
          </div>
        </div>

        {/* Main Container */}
        <div className="main-container">
          {/* Add Item Section */}
          <div className="add-item-section">
            <div className="add-item-container">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                className="add-item-input"
                placeholder="Add an item..."
              />
              
              <div className="add-item-controls">
                {voiceSupported && (
                  <button
                    onClick={toggleVoiceInput}
                    className={`voice-btn ${isListening ? 'listening' : ''}`}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                )}
                
                <button onClick={() => handleAddItem()} className="add-btn">
                  <Plus size={24} />
                </button>
              </div>
            </div>

            {/* Smart Suggestions */}
            {showSuggestions && (
              <div className="suggestions">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddItem(suggestion)}
                    className="suggestion-item"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="controls">
            <div className="controls-wrapper">
              {/* Search */}
              <div className="search-container">
                <div className="search-wrapper">
                  <Search className="search-icon" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search items..."
                    className="search-input"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                {Object.entries(categories).map(([key, category]) => (
                  <option key={key} value={key}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>

              {/* Show Completed Toggle */}
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={`toggle-btn ${showCompleted ? 'active' : ''}`}
              >
                {showCompleted ? 'Hide Completed' : 'Show Completed'}
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="items-container">
            {filteredItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <ShoppingCart size={32} color="var(--text-secondary)" />
                </div>
                <p className="empty-title">
                  {currentItems.length === 0 ? 'Your shopping list is empty' : 'No items match your filters'}
                </p>
                <p className="empty-subtitle">
                  {currentItems.length === 0 ? 'Add items to get started!' : 'Try adjusting your search or filters'}
                </p>
              </div>
            ) : (
              <div className="items-list">
                {filteredItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`item ${item.isSelected ? 'completed' : ''}`}
                  >
                    <div className="item-content">
                      {/* Item Info */}
                      <div className="item-left">
                        <button
                          onClick={() => updateItem(item.id, { isSelected: !item.isSelected })}
                          className={`check-btn ${item.isSelected ? 'checked' : ''}`}
                        >
                          {item.isSelected ? (
                            <CheckCircle size={24} />
                          ) : (
                            <Circle size={24} />
                          )}
                        </button>

                        <div className="item-info">
                          {item.isEditing ? (
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
                              onKeyPress={(e) => e.key === 'Enter' && updateItem(item.id, { isEditing: false })}
                              onBlur={() => updateItem(item.id, { isEditing: false })}
                              className="item-edit-input"
                              autoFocus
                            />
                          ) : (
                            <div>
                              <div className={`item-name ${item.isSelected ? 'completed' : ''}`}>
                                {item.itemName}
                              </div>
                              <div className="item-meta">
                                <span className={`category-tag ${categories[item.category]?.color || 'category-other'}`}>
                                  {categories[item.category]?.icon} {categories[item.category]?.name}
                                </span>
                                {item.price > 0 && (
                                  <span className="item-price">${item.price.toFixed(2)} each</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price Input */}
                      <div className="price-input-container">
                        <DollarSign size={16} color="var(--text-secondary)" />
                        <input
                          type="number"
                          value={item.price || ''}
                          onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="price-input"
                          step="0.01"
                          min="0"
                        />
                      </div>

                      {/* Quantity Controls */}
                      <div className="quantity-controls">
                        <button
                          onClick={() => updateItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}
                          className="quantity-btn"
                          disabled={item.quantity === 0}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="quantity-display">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                          className="quantity-btn"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="item-actions">
                        <button
                          onClick={() => updateItem(item.id, { isEditing: !item.isEditing })}
                          className={`action-btn ${item.isEditing ? 'save' : 'edit'}`}
                        >
                          {item.isEditing ? (
                            <Save size={16} />
                          ) : (
                            <Edit3 size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="action-btn delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Statistics */}
          {currentItems.length > 0 && (
            <div className="footer-stats">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value purple">{totalItems}</div>
                  <div className="stat-label">Total Items</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value green">${totalCost.toFixed(2)}</div>
                  <div className="stat-label">Total Cost</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value blue">{completedItems}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value orange">{currentItems.length - completedItems}</div>
                  <div className="stat-label">Remaining</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;