{ pkgs ? import <nixpkgs> {} }:
let
    projectDir = toString ./.;

    packageJson = builtins.fromJSON (builtins.readFile (projectDir + "/package.json"));

    nodeVersionStr = if packageJson ? "engines" && packageJson.engines ? "node"
                        then packageJson.engines.node
                        else "23";

    # Parse node-version from package.json
    getNodejs = versionStr:
    let
        # Remove any non-digit characters and get the first number
        cleanVersion = builtins.match "([0-9]+).*" versionStr;
        majorVersion = if builtins.isList cleanVersion && builtins.length cleanVersion > 0
                       then builtins.head cleanVersion
                       else "23";
    in
        if builtins.hasAttr "nodejs_${majorVersion}" pkgs
        then pkgs."nodejs_${majorVersion}"
        else pkgs.nodejs_23;  # Default to Node.js 23 if not found

    nodejs = getNodejs nodeVersionStr;

    # get git
    getGitRemoteUrl =
    let
      gitConfigPath = projectDir + "/.git/config";
      gitConfigExists = builtins.pathExists gitConfigPath;
      gitConfig = if gitConfigExists then builtins.readFile gitConfigPath else "";
      urlMatch = builtins.match ".*url = ([^\n]*).*" gitConfig;
    in
      if urlMatch == null then "" else builtins.head urlMatch;

  gitRemoteUrl = getGitRemoteUrl;
in
pkgs.mkShell {
  buildInputs = [
    # Core development tools
    pkgs.git
    # pkgs.nodejs_20  # Latest LTS Node.js
    nodejs
    pkgs.nodePackages.npm
    pkgs.nodePackages.pnpm
    pkgs.nodePackages.yarn
    
    # Python development
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.python311Packages.virtualenv
    pkgs.python311Packages.setuptools
    
    # Build tools
    pkgs.gcc
    pkgs.gnumake
    pkgs.cmake
    pkgs.autoconf
    pkgs.automake
    pkgs.libtool
    
    # Database tools
    pkgs.sqlite
    pkgs.postgresql_15
    
    # Container tools
    pkgs.docker
    pkgs.docker-compose
    
    # Version control tools
    pkgs.git-lfs
    
    # Shell and utilities
    pkgs.fish
    pkgs.jq  # JSON processor
    pkgs.ripgrep  # Better grep
    pkgs.fd  # Better find
    pkgs.bat  # Better cat
    # pkgs.eza or pkgs.lsd as alternatives to exa (better ls)
    
    # Network tools
    pkgs.curl
    pkgs.wget
    
    # Text editors/IDEs (uncomment if needed)
    # pkgs.vim
    # pkgs.neovim
  ];

  shellHook = ''
    echo "Development environment loaded!"
    echo "Available tools:"
    echo " - Node.js: $(node --version)"
    echo " - npm: $(npm --version)"
    echo " - pnpm: $(pnpm --version 2>/dev/null || echo 'not available')"
    echo " - Python: $(python3 --version)"
    echo " - Git: $(git --version)"
    echo " - Docker: $(docker --version 2>/dev/null || echo 'not running')"
    echo " - PostgreSQL: $(psql --version 2>/dev/null || echo 'not configured')"
    echo " - SQLite: $(sqlite3 --version)"
    echo ""
    echo "To use this environment, run: nix-shell dev-environment.nix"
    
    # Set up PATH
    export PATH="$PWD/node_modules/.bin:$PATH"
    
    # Python virtual environment setup
    if [ ! -d .venv ]; then
      echo "Creating Python virtual environment in .venv..."
      python3 -m venv .venv
    fi
    echo "To activate Python virtual environment: source .venv/bin/activate"

    echo "Using Node.js version: ${nodejs.version}"
        cd ${projectDir}

        if [ ! -d node_modules ]; then
            echo "Installing dependencies..."
            pnpm install
        fi

        export PATH="$PWD/node_modules/.bin:$PATH"

        echo "You're @ $PWD"

        # git get
        if [ -d .git ] && [ -z "$(git remote)" ]; then
            if [ -n "${gitRemoteUrl}" ]; then
                echo "Setting up git remote 'origin' with URL: ${gitRemoteUrl}"
                git remote add origin ${gitRemoteUrl}
            else
                echo -e "\e[41mWarning:\e[0m No git remote URL found in .git/config!"
            fi
        fi

        git config --global --add safe.directory ${projectDir}
        git pull

        # Switch to a usable shell
        # echo "Switching you to a shell that's actually usable... "
        # exec fish

        # Do your thing...
        pnpm run dev
  '';
  SHELL = "${pkgs.fish}/bin/fish";
  NIX_ENFORCE_PURITY = 0;
  HOME = builtins.getEnv "HOME";
}
