'use client';

import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { Button } from '@/components/ui/button';
import { ImageIcon, Type } from 'lucide-react';

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

        const updateContent = () => {
            onContentChange(JSON.stringify(canvas.toJSON()));
        };

        canvas.on('object:modified', updateContent);
        canvas.on('object:added', updateContent);
        canvas.on('object:removed', updateContent);

        return () => {
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
                   throw new Error("Not a JSON");
                }
            } catch (e) {
                canvas.clear();
                const text = new fabric.IText(initialContent || 'Metin eklemek için çift tıkla', {
                   left: 50, top: 50, fontFamily: 'sans-serif', fontSize: 18
                });
                canvas.add(text);
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
            fill: '#333'
        });
        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);
        fabricCanvasRef.current.renderAll();
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
            </div>
            <div className="border rounded-md overflow-hidden">
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};
