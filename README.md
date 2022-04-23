# Artboard Multi-Scale

A [Sketch](https://www.sketch.com/) plugin for scaling an Artboard to multiple dimensions at once.

![Logo](assets/logo.png)

## Description

This plugin creates scaled copies of an Artboard in arbitrary dimensions. It also names and arranges the created Artboards in a sensible way:

![Screencast](assets/demo.gif)

The target dimensions can be specified in terms of absolute width, absolute height, and percentage relative to the base Artboard (see [_Dimensions_](#dimensions) below).

## Installation

1. Download the latest version (0.0.1) of the plugin: [`artboard-multi-scale.sketchplugin.zip`](https://github.com/weibeld/artboard-multi-scale/releases/download/v0.0.1/artboard-multi-scale.sketchplugin.zip)
2. Unzip the downloaded zip file
3. Double-click on the extracted `.sketchplugin` file

That's it, the plugin is now installed in Sketch.

> Alternatively, you can also manually copy the `.sketchplugin` file to the [Sketch plugin location](https://developer.sketch.com/plugins#plugin-location) at `~/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins`.

To uninstall the plugin, go to _Plugins > Manage Plugins..._ in Sketch, right-click the plugin, and select _Uninstall "Artboard Multi-Scale"_.

> Alternatively, you can also uninstall the plugin by manually removing the `.sketchplugin` file from the Sketch plugin location at `~/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins`.

## Usage

The plugin is used as follows:

1. Select an Artboard.
1. Select **_Plugins > Artboard Multi-Scale_** or press the **_⌘⇧S_** keyboard shortcut.
1. Enter the desired target dimensions (see [below](#dimensions)) and hit **_OK_**.

## Dimensions

The target dimensions are specified as a space-separated list of dimension specifiers. A dimension specifier specifies either the target absolute width or height, or the target percentage relative to the base Artboard.

The available dimension specifier formats are listed below:

| Format   | Example | Description |
|:--------:|:-------:|-------------|
| **`N`**  | **`50`**      | Specifies the target width (height is determined automatically) |
| **`wN`** | **`w50`**     | Specifies the target width (alias for the **`N`** format) |
| **`hN`** | **`h50`**     | Specifies the target height (width is determined automatically) |
| **`N%`** | **`50%`**     | Specifies the target percentage relative to the base Artboard (width and height are determined automatically)|

> Note that, in the current version of the plugin, **`N`** must be an integer.

Dimension specifiers can be freely mixed, so, for example, `50 w50 h50 50%` is a valid input.

Below is a detailed example using different dimension specifiers.

### Example

Consider the following input:

```
100 w100 h100 50%
```

If this is applied to an Artboard with a **width of 150** and a **height of 300**, the result is as shown below:

![Example](assets/example.png)

The dimension specifiers have the following effects:

- **`100`**: scales the Artboard to a **width of 100** and an automatically calculated **height of 200**.
- **`w100`**: scales the Artboard to a **width of 100** and an automatically calculated **height of 200** (alias for **`100`**).
- **`h100`**: scales the Artboard to a **height of 100** and an automatically calculated **width of 50**.
- **`50%`**: scales the Artboard to an automatically calculated **width of 75** and **height of 150**.

## Development

To modify the plugin, follow the below steps:

> Before proceeding, make sure to [uninstall the plugin](https://developer.sketch.com/plugins/#uninstalling-plugins), in case it's currently installed.

1. Clone the repository and `cd` into it:

    ```bash
    git clone https://github.com/weibeld/artboard-multi-scale
    cd artboard-multi-scale
    ```

2. Create a symlink from the [Sketch plugins directory](https://developer.sketch.com/plugins/#plugin-location) to the `.sketchplugin` directory in the repository:

    ```bash
    ln -s \
      "$PWD"/artboard-multi-scale.sketchplugin \
      ~/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/artboard-multi-scale.sketchplugin
    ``` 

    > The above effectively installs the plugin in Sketch without having to move the plugin files into the Sketch plugin directory. In this way, it's possible to work on the plugin directly from within the repository.

3. Enable [plugin script reloading](https://developer.sketch.com/plugins/debugging#reload-scripts) in Sketch:

    ```bash
    defaults write com.bohemiancoding.sketch3 AlwaysReloadScript -bool YES
    ```

    > The above causes Sketch to always reload a plugin before executing it so that changes are reflected immediately. If this setting is disabled (which is the default), then Sketch must be restarted in order for changes in the plugin code to take effect.

4. Edit the plugin files in the `.sketchplugin` directory, and test the changes by running the plugin in Sketch.

5. When done, uninstall the plugin by deleting the previously created symlink:

    ```bash
    rm ~/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/artboard-multi-scale.sketchplugin
    ```

    > Do **not** uninstall the plugin through the _Plugins > Manage Plugins..._ in Sketch because this deletes the `.sketchplugin` bundle in the repository.
