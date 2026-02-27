import { useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { QrCode, Download, Copy, RefreshCw } from "lucide-react";

const QR_API_BASE = "https://api.qrserver.com/v1/create-qr-code/";

type ErrorCorrection = "L" | "M" | "Q" | "H";
type ImageFormat = "png" | "svg" | "jpg";

const QRCodeGenerator = () => {
  const [content, setContent] = useState("");
  const [size, setSize] = useState(300);
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrection>("M");
  const [format, setFormat] = useState<ImageFormat>("png");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      data: content,
      size: `${size}x${size}`,
      ecc: errorCorrection,
      format,
      color: fgColor.replace("#", ""),
      bgcolor: bgColor.replace("#", ""),
      qzone: "2",
    });
    return `${QR_API_BASE}?${params.toString()}`;
  }, [content, size, errorCorrection, format, fgColor, bgColor]);

  const handleGenerate = () => {
    if (!content.trim()) {
      toast.error("Digite o conteúdo para o QR Code");
      return;
    }
    setLoading(true);
    const url = buildUrl();
    // Pre-load image to confirm API works
    const img = new Image();
    img.onload = () => {
      setGeneratedUrl(url);
      setLoading(false);
      toast.success("QR Code gerado com sucesso!");
    };
    img.onerror = () => {
      setLoading(false);
      toast.error("Erro ao gerar QR Code. Tente novamente.");
    };
    img.src = url;
  };

  const handleDownload = async () => {
    if (!generatedUrl) return;
    try {
      const response = await fetch(generatedUrl);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `qrcode.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Download iniciado!");
    } catch {
      toast.error("Erro ao baixar QR Code");
    }
  };

  const handleCopyUrl = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    toast.success("URL copiada!");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <QrCode className="h-7 w-7 text-primary" />
            Gerador de QR Code
          </h1>
          <p className="text-muted-foreground mt-1">
            Gere QR Codes personalizados para links, textos, PIX e muito mais.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Config Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Conteúdo *</Label>
                <Input
                  placeholder="URL, texto, chave PIX..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tamanho: {size}px</Label>
                <Slider
                  min={100}
                  max={1000}
                  step={50}
                  value={[size]}
                  onValueChange={([v]) => setSize(v)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as ImageFormat)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="svg">SVG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Correção de Erro</Label>
                  <Select value={errorCorrection} onValueChange={(v) => setErrorCorrection(v as ErrorCorrection)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Baixa (7%)</SelectItem>
                      <SelectItem value="M">Média (15%)</SelectItem>
                      <SelectItem value="Q">Alta (25%)</SelectItem>
                      <SelectItem value="H">Máxima (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor do QR</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-10 h-10 rounded border border-input cursor-pointer"
                    />
                    <Input value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor do Fundo</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded border border-input cursor-pointer"
                    />
                    <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <QrCode className="h-4 w-4 mr-2" />}
                Gerar QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              {generatedUrl ? (
                <>
                  <div className="p-4 bg-white rounded-xl shadow-sm border">
                    <img
                      src={generatedUrl}
                      alt="QR Code gerado"
                      className="max-w-full"
                      style={{ width: Math.min(size, 400), height: Math.min(size, 400) }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" /> Baixar
                    </Button>
                    <Button variant="outline" onClick={handleCopyUrl}>
                      <Copy className="h-4 w-4 mr-2" /> Copiar URL
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <QrCode className="h-16 w-16 mx-auto mb-3 opacity-20" />
                  <p>Configure e clique em "Gerar QR Code"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default QRCodeGenerator;
