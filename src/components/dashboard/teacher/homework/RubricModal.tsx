'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper function to get rubric type
const getRubricType = (formats: string) => {
  if (formats.includes("Video") || formats.includes("MP4") || formats.includes("Ses") || formats.includes("MP3")) return 'multimedia';
  if (formats.includes("Canva") || formats.includes("JPG") || formats.includes("Poster") || formats.includes("Fotoğraf") || formats.includes("Görsel")) return 'visual';
  return 'research';
};

export const RubricModal = ({ isOpen, onClose, assignment, rubrics, onAddRubricClick, onSaveRubric }: any) => {
    const [selectedRubricKey, setSelectedRubricKey] = React.useState('');
    const [editableRubric, setEditableRubric] = React.useState<any>(null);

    React.useEffect(() => {
        if (isOpen && assignment) {
            const defaultKey = getRubricType((assignment as any).formats);
            setSelectedRubricKey(defaultKey);
            setEditableRubric(JSON.parse(JSON.stringify(rubrics[defaultKey] || rubrics['research'])));
        }
    }, [isOpen, assignment, rubrics]);

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...editableRubric.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditableRubric({ ...editableRubric, items: newItems });
    };

    const handleAddItem = () => {
        const newItems = [...editableRubric.items, { label: 'Yeni Kriter', score: 10, desc: '' }];
        setEditableRubric({ ...editableRubric, items: newItems });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = editableRubric.items.filter((_:any, i:number) => i !== index);
        setEditableRubric({ ...editableRubric, items: newItems });
    };

    const handleSave = () => {
        onSaveRubric(selectedRubricKey, editableRubric);
        onClose();
    };

    if (!isOpen || !assignment || !editableRubric) return null;

    const totalScore = editableRubric.items.reduce((acc: any, curr: any) => acc + (parseInt(curr.score) || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all scale-100 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Değerlendirme Kriterleri</h2>
                        <p className="text-sm text-gray-500 mt-1">{assignment.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="mb-6 flex gap-2 items-end">
                        <div className="flex-grow">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kullanılacak Kriter Seti</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={selectedRubricKey}
                                onChange={(e) => {
                                    const newKey = e.target.value;
                                    setSelectedRubricKey(newKey);
                                    setEditableRubric(JSON.parse(JSON.stringify(rubrics[newKey])));
                                }}
                            >
                                <optgroup label="Standart Kriterler">
                                    <option value="research">Araştırma ve Yazma Rubriği</option>
                                    <option value="multimedia">Multimedya ve Sunum Rubriği</option>
                                    <option value="visual">Görsel Tasarım Rubriği</option>
                                </optgroup>
                                <optgroup label="Özel Kriterler">
                                    {Object.keys(rubrics).filter(k => k.startsWith('custom')).map(key => (
                                        <option key={key} value={key}>{rubrics[key].title}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <button
                            onClick={() => { onClose(); onAddRubricClick(); }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"
                            title="Yeni Kriter Seti Ekle"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="mb-4 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <span className="font-semibold">Açıklama:</span> {editableRubric.description}
                    </div>

                    <div className="space-y-3">
                        {editableRubric.items.map((item: any, index: number) => (
                            <div key={index} className="flex gap-2 p-3 rounded-xl border bg-gray-50/50">
                                <div className="flex-grow space-y-2">
                                     <Input 
                                        value={item.label}
                                        onChange={(e) => handleItemChange(index, 'label', e.target.value)}
                                        className="font-bold text-gray-800 text-base"
                                        placeholder="Kriter Adı"
                                    />
                                    <Textarea 
                                        value={item.desc}
                                        onChange={(e) => handleItemChange(index, 'desc', e.target.value)}
                                        className="text-sm text-gray-600"
                                        placeholder="Kriter Açıklaması"
                                        rows={1}
                                    />
                                </div>
                                <div className="flex flex-col items-center justify-center gap-1 w-24">
                                     <Input 
                                        type="number"
                                        value={item.score}
                                        onChange={(e) => handleItemChange(index, 'score', e.target.value)}
                                        className="w-20 h-10 text-center text-xl font-bold text-blue-600"
                                    />
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Puan</span>
                                </div>
                                 <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        ))}
                    </div>
                     <Button onClick={handleAddItem} variant="outline" className="mt-4 w-full border-dashed">
                        <Plus size={16} className="mr-2" /> Kriter Ekle
                    </Button>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-right">
                        <span className="text-sm text-gray-500 mr-2">Toplam Puan:</span>
                        <span className={`text-2xl font-bold ${totalScore === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                            {totalScore}
                        </span>
                    </div>
                     <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Save size={16} className="mr-2" /> Değişiklikleri Kaydet
                    </Button>
                </div>
            </div>
        </div>
    );
};
