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
        nodejs
        pkgs.nodePackages.pnpm
        pkgs.fish
        pkgs.git
    ];

    shellHook = ''
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
        echo "Switching you to a shell that's actually usable... "
        exec fish

        # Do your thing...
        pnpm run dev
    '';

  SHELL = "${pkgs.fish}/bin/fish";
  NIX_ENFORCE_PURITY = 0;
  HOME = builtins.getEnv "HOME";
}
