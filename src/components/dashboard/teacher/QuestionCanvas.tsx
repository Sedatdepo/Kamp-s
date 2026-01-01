
'use client';

import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { Button } from '@/components/ui/button';
import { ImageIcon, Type, Trash2 } from 'lucide-react';

interface QuestionCanvasProps {
    initialContent?: string;
    onContentChange: (content: string) => void;
}

export const QuestionCanvas = ({ initialContent, onContentChange }: QuestionCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, {
            backgroundColor: '#f8fafc', // slate-50
            width: 800,
            height: 600,
        });
        fabricCanvasRef.current = canvas;
        
        // Add grid
        const grid = 20;
        for (let i = 0; i < (800 / grid); i++) {
            canvas.add(new fabric.Line([ i * grid, 0, i * grid, 600], { stroke: '#e2e8f0', selectable: false, evented: false }));
            canvas.add(new fabric.Line([ 0, i * grid, 800, i * grid], { stroke: '#e2e8f0', selectable: false, evented: false }))
        }


        const updateContent = () => {
            onContentChange(JSON.stringify(canvas.toJSON()));
        };

        canvas.on('object:modified', updateContent);
        canvas.on('object:added', updateContent);
        canvas.on('object:removed', updateContent);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObject = canvas.getActiveObject();
                if (activeObject) {
                    // Prevent deleting text while editing an IText object
                    if (activeObject.isEditing) return;
                    
                    if (activeObject.type === 'activeSelection') {
                         (activeObject as fabric.ActiveSelection).forEachObject(obj => canvas.remove(obj));
                    }
                    canvas.remove(activeObject);
                    canvas.discardActiveObject();
                    canvas.renderAll();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            canvas.dispose();
        };
    }, [onContentChange]);
    
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
            try {
                if (initialContent && JSON.parse(initialContent)) {
                    canvas.loadFromJSON(initialContent, () => {
                        canvas.renderAll();
                    });
                } else {
                   // If it's not JSON or empty, clear the canvas
                   canvas.clear();
                   // Re-add grid since clear removes it
                    const grid = 20;
                    for (let i = 0; i < (800 / grid); i++) {
                        canvas.add(new fabric.Line([ i * grid, 0, i * grid, 600], { stroke: '#e2e8f0', selectable: false, evented: false }));
                        canvas.add(new fabric.Line([ 0, i * grid, 800, i * grid], { stroke: '#e2e8f0', selectable: false, evented: false }))
                    }
                    if(initialContent) { // If it's plain text, add it
                         const text = new fabric.IText(initialContent, {
                           left: 50, top: 50, fontFamily: 'sans-serif', fontSize: 18, objectCaching: false
                        });
                        canvas.add(text);
                    }
                    canvas.renderAll();
                }
            } catch (e) {
                // Not a JSON, treat as plain text or empty
                canvas.clear();
                 const grid = 20;
                 for (let i = 0; i < (800 / grid); i++) {
                    canvas.add(new fabric.Line([ i * grid, 0, i * grid, 600], { stroke: '#e2e8f0', selectable: false, evented: false }));
                    canvas.add(new fabric.Line([ 0, i * grid, 800, i * grid], { stroke: '#e2e8f0', selectable: false, evented: false }))
                 }
                if(initialContent){
                    const text = new fabric.IText(initialContent, {
                       left: 50, top: 50, fontFamily: 'sans-serif', fontSize: 18, objectCaching: false
                    });
                    canvas.add(text);
                }
                canvas.renderAll();
            }
        }
    }, [initialContent]);


    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && fabricCanvasRef.current) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgObj = new Image();
                imgObj.src = event.target?.result as string;
                imgObj.onload = () => {
                    const image = new fabric.Image(imgObj);
                    image.scaleToWidth(200);
                    fabricCanvasRef.current?.add(image);
                    fabricCanvasRef.current?.centerObject(image);
                    fabricCanvasRef.current?.renderAll();
                };
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAddText = () => {
        if (!fabricCanvasRef.current) return;
        const text = new fabric.IText('Metin eklemek için çift tıkla', {
            left: 100,
            top: 100,
            fontFamily: 'sans-serif',
            fontSize: 20,
            fill: '#333',
            objectCaching: false
        });
        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);
        fabricCanvasRef.current.renderAll();
    };

    const handleDeleteSelected = () => {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
            const activeObject = canvas.getActiveObject();
            if (activeObject) {
                 if (activeObject.type === 'activeSelection') {
                    (activeObject as fabric.ActiveSelection).forEachObject(obj => canvas.remove(obj));
                }
                canvas.remove(activeObject);
                canvas.discardActiveObject();
                canvas.renderAll();
            }
        }
    };

    return (
        <div className="space-y-4">
             <div className="flex gap-2">
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="mr-2 h-4 w-4"/> Resim Ekle
                </Button>
                <Button variant="outline" onClick={handleAddText}>
                    <Type className="mr-2 h-4 w-4"/> Metin Ekle
                </Button>
                 <Button variant="destructive" onClick={handleDeleteSelected}>
                    <Trash2 className="mr-2 h-4 w-4"/> Seçileni Sil
                </Button>
            </div>
            <div className="border rounded-md overflow-hidden shadow-inner bg-slate-50">
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};
