import { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Camera, Upload, History } from 'lucide-react';
import { getChineseBreedName } from '@/lib/dogBreeds';

function App() {
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ image: string; prediction: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadModel() {
      try {
        await tf.ready();
        const loadedModel = await mobilenet.load({
          version: 2,
          alpha: 1.0
        });
        setModel(loadedModel);
        toast({
          title: "模型已加載",
          description: "狗品種識別模型已成功加載。",
        });
      } catch (error) {
        console.error('Failed to load model:', error);
        toast({
          title: "模型加載失敗",
          description: "無法加載狗品種識別模型。請檢查您的網絡連接並刷新頁面。",
          variant: "destructive",
        });
      }
    }
    loadModel();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    toast({
      title: "功能未實現",
      description: "相機捕獲功能尚未實現。",
    });
  };

  const predictBreed = async () => {
    if (model && imageUrl) {
      try {
        const img = new Image();
        img.src = imageUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        const tfImg = tf.browser.fromPixels(img);
        const predictions = await model.classify(tfImg);
        tfImg.dispose();

        if (predictions && predictions.length > 0) {
          const topPrediction = predictions[0];
          const chineseBreedName = getChineseBreedName(topPrediction.className);
          setPrediction(`預測的狗品種: ${chineseBreedName} (可信度: ${(topPrediction.probability * 100).toFixed(2)}%)`);
          setHistory(prev => [...prev, { image: imageUrl, prediction: chineseBreedName }]);
        }
      } catch (error) {
        console.error('Prediction failed:', error);
        toast({
          title: "預測失敗",
          description: "無法識別狗品種。請嘗試上傳另一張圖片。",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>狗品種識別</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input type="file" onChange={handleImageUpload} ref={fileInputRef} className="hidden" accept="image/*" />
            <div className="flex space-x-2">
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> 上傳圖片
              </Button>
              <Button onClick={handleCameraCapture}>
                <Camera className="mr-2 h-4 w-4" /> 使用相機
              </Button>
            </div>
            {imageUrl && <img src={imageUrl} alt="Uploaded dog" className="max-w-full h-auto mt-4" />}
            <Button onClick={predictBreed} disabled={!imageUrl || !model}>識別品種</Button>
            {prediction && <p className="text-lg font-semibold mt-4">{prediction}</p>}
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}

export default App;