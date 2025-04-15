import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Info } from "lucide-react";
import { useState } from "react";

export interface ConflictDetail {
  scheduleDetail: {
    id: number;
    roleId: number;
    volunteerId: number;
  };
  schedule: {
    id: number;
    teamId: number;
    serviceId?: number;
    date: string;
  };
  role: {
    id: number;
    name: string;
  };
  team: {
    id: number;
    name: string;
  };
}

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: ConflictDetail;
  volunteerName: string;
  onResolution: (resolution: string) => Promise<void>;
}

export function ConflictModal({
  isOpen,
  onClose,
  conflict,
  volunteerName,
  onResolution,
}: ConflictModalProps) {
  const [resolution, setResolution] = useState<string>("keep");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResolution = async () => {
    setIsProcessing(true);
    try {
      await onResolution(resolution);
      onClose();
    } catch (error) {
      console.error("Error resolving conflict:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100 text-red-500 mr-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-lg font-medium text-red-800">
              Conflito de Escalação
            </AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="text-slate-600 py-2">
          O voluntário <span className="font-medium">{volunteerName}</span> já 
          está escalado para o <span className="font-medium">Culto</span> no 
          time <span className="font-medium">{conflict.team.name}</span>.
        </AlertDialogDescription>
        
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-5">
          <div className="flex items-center mb-2">
            <Info className="h-5 w-5 text-amber-500 mr-2" />
            <span className="text-sm font-medium text-amber-800">Detalhes do Conflito</span>
          </div>
          <div className="text-sm text-amber-700 pl-7">
            <p><strong>Time:</strong> {conflict.team.name}</p>
            <p><strong>Função:</strong> {conflict.role.name}</p>
            <p><strong>Data:</strong> {new Date(conflict.schedule.date).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        
        <div className="space-y-3 mb-5">
          <p className="font-medium text-slate-700">Como deseja proceder?</p>
          <RadioGroup value={resolution} onValueChange={setResolution}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="keep" id="option1" />
              <Label htmlFor="option1" className="text-sm text-slate-700">
                Manter a escalação atual e cancelar a nova
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="replace" id="option2" />
              <Label htmlFor="option2" className="text-sm text-slate-700">
                Substituir a escalação atual por esta nova
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="option3" />
              <Label htmlFor="option3" className="text-sm text-slate-700">
                Escalar o voluntário em ambos os times
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleResolution} 
            disabled={isProcessing}
          >
            {isProcessing ? "Processando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
