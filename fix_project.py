import os

# --- CONFIGURAÇÃO ---

# 1. Mapeamento de nomes de ícones de kebab-case para PascalCase
icon_replacements = {
    '"file-search-2"': '"FileSearch2"',
    '"calendar-clock"': '"CalendarClock"',
    '"trending-up"': '"TrendingUp"',
    '"check-circle"': '"CheckCircle"',
    '"arrow-left"': '"ArrowLeft"',
    '"alert-triangle"': '"AlertTriangle"',
    '"file-text"': '"FileText"',
    '"loader-2"': '"Loader2"',
    '"log-out"': '"LogOut"',
    '"arrow-right-circle"': '"ArrowRightCircle"',
    '"check-circle-2"': '"CheckCircle2"',
    '"key-round"': '"KeyRound"',
    '"chevron-down"': '"ChevronDown"',
    # Adicione nomes sem hífem para garantir a capitalização correta
    '"home"': '"Home"',
    '"calendar"': '"Calendar"',
    '"info"': '"Info"',
    '"user"': '"User"',
    '"credit-card"': '"CreditCard"'
}

# 2. Caminhos dos arquivos que precisam de substituição de ícones
files_to_patch = [
    'src/components/Calculator.tsx',
    'src/app/page.tsx',
    'src/components/AuthModal.tsx'
]

# 3. Caminho e novo conteúdo para o componente LucideIcon
lucide_icon_path = 'src/components/LucideIcon.tsx'
new_lucide_icon_content = """
"use client";

import { icons, type LucideProps, type Icon as LucideIconType } from "lucide-react";

// Define que o nome do ícone DEVE ser um dos nomes oficiais da biblioteca
export type IconName = keyof typeof icons;

type LucideIconProps = LucideProps & {
  name: IconName;
};

export function LucideIcon({ name, ...props }: LucideIconProps) {
  const Icon = icons[name] as LucideIconType;

  if (!Icon) {
    // Um ícone de fallback caso o nome seja inválido
    return <icons.HelpCircle {...props} />;
  }

  return <Icon {...props} />;
}

export default LucideIcon;
"""

# --- LÓGICA DO SCRIPT ---

def apply_fixes():
    """Aplica as correções no projeto."""
    print("Iniciando script de correção do projeto...\n")
    
    # --- Passo 1: Corrigir LucideIcon.tsx ---
    try:
        with open(lucide_icon_path, 'w', encoding='utf-8') as f:
            f.write(new_lucide_icon_content)
        print(f"✅ SUCESSO: Arquivo '{lucide_icon_path}' foi substituído com a versão corrigida.")
    except FileNotFoundError:
        print(f"❌ ERRO: Arquivo '{lucide_icon_path}' não encontrado. Verifique se o script está na raiz do projeto.")
        return
    except Exception as e:
        print(f"❌ ERRO: Falha ao escrever em '{lucide_icon_path}': {e}")
        return

    # --- Passo 2: Corrigir nomes dos ícones nos outros arquivos ---
    print("\nIniciando substituição dos nomes dos ícones...")
    for file_path in files_to_patch:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for old, new in icon_replacements.items():
                content = content.replace(old, new)
            
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ SUCESSO: Ícones corrigidos em '{file_path}'.")
            else:
                print(f"🟡 AVISO: Nenhum ícone para corrigir em '{file_path}'.")

        except FileNotFoundError:
            print(f"❌ ERRO: Arquivo '{file_path}' não encontrado.")
        except Exception as e:
            print(f"❌ ERRO: Falha ao processar '{file_path}': {e}")
            
    # --- Passo 3: Instruções finais ---
    print("\n---------------------------------------------------------")
    print("🎉 Script finalizado! Os erros de código foram corrigidos.")
    print("\n👇 AÇÃO FINAL NECESSÁRIA 👇")
    print("Para resolver o erro 'Unknown at rule @tailwind' no arquivo CSS:")
    print("1. Vá para a aba de Extensões no VS Code (Ctrl+Shift+X).")
    print("2. Procure por 'Tailwind CSS IntelliSense' (da Tailwind Labs).")
    print("3. Clique em 'Instalar' e reinicie o VS Code se necessário.")
    print("---------------------------------------------------------")


if __name__ == "__main__":
    # Verifica se está no diretório correto
    if not os.path.exists('src'):
        print("❌ ERRO: Este script deve ser executado da pasta raiz do seu projeto Next.js (a que contém a pasta 'src').")
    else:
        apply_fixes()