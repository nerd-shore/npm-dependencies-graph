#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const outputDir = 'report';
const outputFile = path.join(outputDir, 'dependency-graph.html');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to generate the HTML content
function generateHtmlContent(dependencies) {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dependency Tree Visualization</title>
    <style>
      .node {
        transition: all .3s ease-in-out;
      }
      .node rect {
        fill: #fff;
        stroke: #000;
        stroke-width: 1px;
      }
    
      .node text {
        font-family: Arial, sans-serif;
        font-size: 12px;
        pointer-events: none;
      }
    
      .line {
        stroke: #999;
        stroke-width: 1px;
      }
    
      .highlight, .highlight-diff {
        cursor: pointer;
      }
    
      .highlight rect {
        fill: lightgreen;
      }
    
      .highlight-diff rect {
        fill: lightcoral;
      }
      .hide {
        height: 1px;
        max-height: 1px;
        /* visibility: hidden; */
      }
    </style>
  </head>
  <body>
    <div id="tree"></div>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const dependencies = ${JSON.stringify(dependencies.dependencies)};
      
        const svgNS = "http://www.w3.org/2000/svg";
        const container = document.getElementById("tree");
        let svg = document.createElementNS(svgNS, "svg");
        container.appendChild(svg);
      
        let yPos = 20;
      
        function drawNode(name, version, level=0) {
          let group = document.createElementNS(svgNS, "g");
          group.setAttribute("class", "node");
          group.setAttribute("data-name", name);
          group.setAttribute("data-version", version);
      
          let rect = document.createElementNS(svgNS, "rect");
          rect.setAttribute("x", 20 + level * 30);
          rect.setAttribute("y", yPos);
          rect.setAttribute("width", 300);
          rect.setAttribute("height", 20);
      
          let text = document.createElementNS(svgNS, "text");
          text.setAttribute("x", 25 + level * 30);
          text.setAttribute("y", yPos + 15);
          text.textContent = name + "@" + version;
      
          group.appendChild(rect);
          group.appendChild(text);
          svg.appendChild(group);
      
          yPos += 30;
        }
      
        function drawTree(dependencies, level=0) {
          Object.keys(dependencies).forEach(key => {
            drawNode(key, dependencies[key].version, level);
            if (dependencies[key].dependencies) {
              drawTree(dependencies[key].dependencies, level + 1);
            }
          });
        }
      
        drawTree(dependencies);
      
        svg.setAttribute("width", 500);
        svg.setAttribute("height", yPos);
      
        // Interaction
        document.querySelectorAll('.node').forEach(node => {
          node.addEventListener('mouseover', function() {
            const name = this.getAttribute('data-name');
            const version = this.getAttribute('data-version');
            document.querySelectorAll('.node[data-name="' + name + '"]').forEach(node => {
              if (node.getAttribute('data-version') === version) {
                node.classList.add('highlight');
              } else {
                node.classList.add('highlight-diff');
              }
            });
            document.querySelectorAll('.node[data-name]').forEach(node => {
              if (node.getAttribute('data-name') !== name) {
                  node.classList.add('hide');
              }
            });
          });
      
          node.addEventListener('mouseout', function() {
            document.querySelectorAll('.highlight, .highlight-diff').forEach(node => {
              node.classList.remove('highlight');
              node.classList.remove('highlight-diff');
            });
            document.querySelectorAll('.node[data-name]').forEach(node => {
              node.classList.remove('hide');
            });
          });
        });
      });
    </script>
  </body>
</html>
`;

  fs.writeFile(outputFile, htmlContent, (err) => {
    if (err) {
      console.error('Failed to write the HTML file:', err);
      return;
    }
    console.log(`Dependency visualization created at: ${outputFile}`);
  });
}

// Function to generate the dependencies.json
function generateDependenciesJson(depth) {
  let command = 'npm ls --json';
  let args = process.argv.slice(2);
  if (args.length) {
    args = args.join(' ')
    command += ` ${args}`
  }
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ${command}: ${error}`);
      return;
    }

    try {
      const dependencies = JSON.parse(stdout);
      generateHtmlContent(dependencies);
    } catch (parseError) {
      console.error(`Failed to parse the ${command} output:`, parseError);
    }
  });
}

generateDependenciesJson();
