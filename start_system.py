"""
Script de InicializaÃ§Ã£o do Sistema Multi-Agente TaxHub
Verifica dependÃªncias, configura ambiente e inicia orchestrator
"""

import sys
import os
from pathlib import Path
import subprocess

# Cores para terminal
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}âœ… {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}âš ï¸  {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}âŒ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.BLUE}â„¹ï¸  {text}{Colors.END}")


def check_python_version():
    """Verifica versÃ£o do Python"""
    print_info("Verificando versÃ£o do Python...")
    version = sys.version_info
    
    if version.major == 3 and version.minor >= 8:
        print_success(f"Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print_error(f"Python {version.major}.{version.minor} nÃ£o suportado")
        print_error("Ã‰ necessÃ¡rio Python 3.8+")
        return False


def check_dependencies():
    """Verifica dependÃªncias instaladas"""
    print_info("Verificando dependÃªncias...")
    
    required = [
        ("crewai", "crewai"),
        ("flask", "flask"),
        ("flask_cors", "flask-cors"),
        ("dotenv", "python-dotenv"),
        ("yaml", "pyyaml"),
        ("google.generativeai", "google-generativeai")
    ]
    
    missing = []
    
    for module, package in required:
        try:
            __import__(module)
            print_success(f"{package}")
        except ImportError:
            print_warning(f"{package} nÃ£o instalado")
            missing.append(package)
    
    return missing


def install_dependencies(packages):
    """Instala dependÃªncias faltantes"""
    if not packages:
        return True
    
    print_info(f"Instalando {len(packages)} pacotes...")
    
    try:
        for package in packages:
            print(f"   Instalando {package}...")
            subprocess.check_call([
                sys.executable,
                "-m",
                "pip",
                "install",
                package,
                "-q"
            ])
        print_success("Todas as dependÃªncias instaladas")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Erro ao instalar: {e}")
        return False


def check_env_file():
    """Verifica arquivo .env"""
    print_info("Verificando configuraÃ§Ãµes (.env)...")
    
    env_path = Path(".env")
    
    if not env_path.exists():
        print_warning(".env nÃ£o encontrado")
        print_info("Criando .env template...")
        
        with open(env_path, 'w') as f:
            f.write("# TaxHub Multi-Agent Configuration\n")
            f.write("GOOGLE_API_KEY=\n")
            f.write("GEMINI_API_KEY=\n")
            f.write("\n# Optional\n")
            f.write("# FLASK_DEBUG=True\n")
            f.write("# PORT=5000\n")
        
        print_warning("Configure GOOGLE_API_KEY no arquivo .env")
        return False
    
    # Verificar se tem API key
    with open(env_path) as f:
        content = f.read()
    
    if "GOOGLE_API_KEY=" in content and len(content.split("GOOGLE_API_KEY=")[1].split("\n")[0].strip()) > 0:
        print_success(".env configurado")
        return True
    else:
        print_warning("GOOGLE_API_KEY nÃ£o configurada no .env")
        return False


def check_config_files():
    """Verifica arquivos de configuraÃ§Ã£o"""
    print_info("Verificando arquivos de configuraÃ§Ã£o...")
    
    config_dir = Path("config")
    
    if not config_dir.exists():
        print_warning("DiretÃ³rio config/ nÃ£o encontrado")
        print_info("Criando estrutura de diretÃ³rios...")
        config_dir.mkdir(parents=True)
    
    # Verificar agents_config.yaml
    agents_config = config_dir / "agents_config.yaml"
    if agents_config.exists():
        print_success("agents_config.yaml encontrado")
    else:
        print_warning("agents_config.yaml nÃ£o encontrado")
        print_info("SerÃ¡ criado automaticamente na primeira execuÃ§Ã£o")
    
    return True


def check_orchestrator_files():
    """Verifica arquivos principais do orchestrator"""
    print_info("Verificando arquivos do sistema...")
    
    required_files = [
        "orchestrator.py",
        "agent_registry.py",
        "agent_router.py"
    ]
    
    all_ok = True
    
    for file in required_files:
        if Path(file).exists():
            print_success(file)
        else:
            print_error(f"{file} nÃ£o encontrado")
            all_ok = False
    
    return all_ok


def start_orchestrator():
    """Inicia o orchestrator"""
    print_header("INICIANDO ORCHESTRATOR")
    
    try:
        print_info("Executando orchestrator.py...")
        print_info("Servidor serÃ¡ iniciado em http://localhost:5000")
        print_info("Pressione Ctrl+C para parar\n")
        
        subprocess.run([sys.executable, "orchestrator.py"])
        
    except KeyboardInterrupt:
        print("\n")
        print_info("Orchestrator encerrado pelo usuÃ¡rio")
    except Exception as e:
        print_error(f"Erro ao iniciar orchestrator: {e}")


def main():
    """FunÃ§Ã£o principal"""
    print_header("TAXHUB MULTI-AGENT SYSTEM - STARTUP")
    
    # 1. Verificar Python
    if not check_python_version():
        return 1
    
    print()
    
    # 2. Verificar dependÃªncias
    missing = check_dependencies()
    
    if missing:
        print()
        response = input(f"\nDeseja instalar {len(missing)} pacotes faltantes? (s/n): ")
        if response.lower() == 's':
            if not install_dependencies(missing):
                return 1
        else:
            print_error("Sistema requer todas as dependÃªncias")
            return 1
    
    print()
    
    # 3. Verificar .env
    env_ok = check_env_file()
    
    if not env_ok:
        print_error("\nConfigure o .env antes de continuar")
        print_info("Adicione sua GOOGLE_API_KEY no arquivo .env")
        return 1
    
    print()
    
    # 4. Verificar configs
    check_config_files()
    
    print()
    
    # 5. Verificar arquivos
    if not check_orchestrator_files():
        print_error("\nArquivos essenciais nÃ£o encontrados")
        return 1
    
    print()
    
    # 6. Iniciar sistema
    print_success("Todas as verificaÃ§Ãµes passaram!")
    print()
    
    response = input("Deseja iniciar o orchestrator agora? (s/n): ")
    if response.lower() == 's':
        start_orchestrator()
    else:
        print_info("Para iniciar manualmente, execute: python orchestrator.py")
    
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n")
        print_info("Setup cancelado")
        sys.exit(1)