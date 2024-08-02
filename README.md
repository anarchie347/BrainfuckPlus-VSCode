# brainfuckplus README

Syntax highlighting and linting for BrainfuckPlus

Currently in development

Will be released on the vscode marketplace, currently having issues with this at the moment

BrainfuckPlus: [BrainfuckPlus transpiler](https://github.com/anarchie347/BrainfuckPlus)

## Features
- Syntax highlighting (it is reccomended to install the original colour theme)
- Linting
- Method documentation (see below)

## Method Documentation

You can specify certain documentation for any methods you make.

You can give a description, a list of cells used by the method and details about any parameters

These must be given on the first 3 (more if you multiple parameters) lines of the method file and must be formatted as below

The `Cells` section uses a comma separated list to state all cells that may be modified by the function. [0] would indicate the index the function is called on, [1] would be the index after, [-1] would be the index before etc...

The `Parameter` sections should use 0 based indexing to describe details about each paramter, such as when it is called and which cell (relative to the calling cell) is the parameter invoked on

```
//Description: checks if the current cell is 0
//Cells: 1, 2, 3
//Parameter 0: Code to run if the cell is 0. Executed at [4]
//Parameter 1: Code to run if the cell is not 0. Executed at [4]
```
These details give a desciption of a method that modifies the 3 cells after the one it is called on, but not the cell it is called on. Any parameeters passed are called on the 4th cell after the cell that the method was originally called on

When a call to this method is hovered over, the following would be shown: 

**z**

checks if the current cell is 0

Required cells: [1], [2], [3]

**Parameters:**

- 0: Code to run if the cell is 0. Executed at [4]

- 1: Code to run if the cell is 0. Executed at [4]
