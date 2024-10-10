# Barry's Website

Barry's Website is a locally hosted web application that provides extensive control over home systems such as lights, alarms, and more. The website is designed to run on a Raspberry Pi 5 and is accessible exclusively within the local area network (LAN) via the URL `barry.local`. This setup ensures secure and efficient management of home automation features.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Server Configuration](#server-configuration)
  - [1. Update and Upgrade the System](#1-update-and-upgrade-the-system)
  - [2. Install Apache2](#2-install-apache2)
  - [3. Configure Apache2 for Barry's Website](#3-configure-apache2-for-barrys-website)
    - [a. Enable SSI (Server Side Includes)](#a-enable-ssi-server-side-includes)
    - [b. Configure Virtual Host](#b-configure-virtual-host)
  - [4. Set Up Git for Automatic Deployment](#4-set-up-git-for-automatic-deployment)
    - [a. Install Git](#a-install-git)
    - [b. Clone the Repository](#b-clone-the-repository)
    - [c. Configure Automatic Deployment with Git Hooks](#c-configure-automatic-deployment-with-git-hooks)
- [Deployment Workflow](#deployment-workflow)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Customization](#customization)
- [License](#license)

## Features

- **Local Access**: Accessible only within the LAN at `barry.local`.
- **Home Automation Control**: Manage lights, alarms, and other home systems.
- **Automatic Deployment**: Seamlessly deploy updates via Git pushes.
- **Secure Access**: Utilizes SSH keys for secure communication between PC and Raspberry Pi.

## Server Configuration

### 1. Update and Upgrade the System

First, ensure your Raspberry Pi's package list and installed packages are up to date.

```bash
ssh barry@barry.local
sudo apt update
sudo apt upgrade -y
```

### 2. Install Apache2

Install the Apache2 web server to host the website.

```bash
sudo apt install apache2 -y
```

### 3. Configure Apache2 for Barry's Website

#### a. Enable SSI (Server Side Includes)

Since the website uses `.shtml` files, SSI must be enabled.

1.  **Enable `mod_include`:**
 ```bash
 sudo a2enmod include
```

2.  **Configure `AllowOverride` and `Options` for SSI:**
    
    Edit the default Apache configuration file.
    
    ```bash
    sudo nano /etc/apache2/sites-available/000-default.conf
    ```
    
    Add the following within the `<VirtualHost *:80>` block:
    
    ```apache
    <Directory /var/www/html>
        Options +Includes
        AllowOverride All
        Require all granted
    </Directory>
    ```
    
    **Note**: Replace `/var/www/html` with the actual path if different.
    
3.  **Restart Apache2:**
    
    ```bash
    sudo systemctl restart apache2
    ```

#### b. Configure Virtual Host

1.  **Create the Website Directory:**
    
    ```bash
    sudo mkdir -p /var/www/html
    ```
    
2.  **Change ownership:** Assign ownership of the `/var/www/html/` directory and its contents to the `www-data` user and group.
    
    ```bash
    sudo chown -R www-data:www-data /var/www/html
    ```
    
3. **Adjust Permissions:** Grant group read and write permissions to ensure that members of the `www-data` group can modify the files.

   ```bash
   sudo chmod -R g+rw /var/www/html
   ```

4. **Set the SetGID Bit on Directories:** This ensures that new files and directories inherit the `www-data` group.

    ```bash
    sudo find /var/www/html -type d -exec chmod g+s {} \;
    ```

5. **Ensure `barry` is in the `www-data` Group:** Verify that the user `barry` is a member of the `www-data` group to inherit the necessary permissions.

    ```bash
    sudo usermod -aG www-data barry
    ```

6.  **Enable `.shtml` Files:**
    
    Edit the Apache configuration to recognize `.shtml` files.
    
    ```bash
    sudo nano /etc/apache2/apache2.conf
    ```
    
    Add the following line:
    
    ```apache
    AddType text/html .shtml
    ```
    
7.  **Restart Apache2:**
    
    ```bash
    sudo systemctl restart apache2
    ```
    
### 4. Set Up Git for Automatic Deployment

#### a. Install Git

If Git is not already installed, install it on the Raspberry Pi.

```bash
sudo apt install git -y
```

#### b. Configure Automatic Deployment with Git Hooks

To enable automatic deployment on new pushes, set up a Git post-receive hook.

1.  **Create a Bare Repository:**
    
    ```bash
    mkdir ~/git/barry_website.git
    cd ~/git/barry_website.git
    git init --bare
    ```
    
2.  **Set Up the Hook:**
    
    Create the `post-receive` hook script.
    
    ```bash
    nano hooks/post-receive
    ```
    
    Add the following content:
    
    ```bash
    #!/bin/bash
    # Define variables for readability and maintainability
    GIT_REPO=/home/barry/git/barry_website.git
    WORK_TREE=/var/www/html
    TMP_DIR=$(mktemp -d)
    LOGFILE=/home/barry/git/barry_website.git/hooks/post-receive.log
    
    # Log the start of the deployment
    echo "Deployment started at $(date)" >> $LOGFILE
    
    # Checkout the latest code to the temporary directory
    git --work-tree=$TMP_DIR --git-dir=$GIT_REPO checkout -f >> $LOGFILE 2>&1
    
    # Rsync the deploy directory to /var/www/html without preserving group ownership
    rsync -av --no-group --delete $TMP_DIR/deploy/ $WORK_TREE/ >> $LOGFILE 2>&1
    
    # Restart Apache
    sudo systemctl restart apache2 >> $LOGFILE 2>&1
    
    # Update ownership
    sudo chown -R www-data:www-data $WORK_TREE >> $LOGFILE 2>&1
    
    # Clean up the temporary directory
    rm -rf $TMP_DIR
    
    # Log the end of the deployment
    echo "Deployment finished at $(date)" >> $LOGFILE

    ```
    
    **Note**: Adjust the `GIT_WORK_TREE` path if your website directory differs.
    
3.  **Make the Hook Executable:**
    
    ```bash
    chmod +x hooks/post-receive
    ```
    
4.  **Add the Raspberry Pi as a Remote in Your Local Repository:**
    
    On your PC, navigate to your local `barry_website` repository and add the Raspberry Pi as a remote.
    
    ```bash
    cd path/to/barry_website
    git remote add rpi ssh://barry@barry.local/home/barry/git/barry_website.git
    ```
    
5.  **Push to Deploy:**
    
    Whenever you push to the `rpi` remote, the Raspberry Pi will automatically deploy the changes.

    ```bash
    git push rpi master
    ```
    
    **Note**: Replace `master` with your branch name if different.
    

## Deployment Workflow

1.  **Develop Locally**: Make changes to your website on your local machine.
    
2.  **Commit Changes**:
    
    ```bash
    git add .
    git commit -m "Your commit message"
    ```
    
3.  **Push to Raspberry Pi**:

    ```bash
    git push rpi master
    ```

4.  **Automatic Deployment**: The `post-receive` hook on the Raspberry Pi will automatically update the website files and restart Apache2 to apply changes.
    

## Usage

-   **Accessing the Website**: Open a web browser on any device within your LAN and navigate to [http://barry.local](http://barry.local/).
    
-   **Managing Home Systems**: Use the website interface to control home automation features such as lights and alarms.
    
    

## License

This project is licensed under the MIT License.
