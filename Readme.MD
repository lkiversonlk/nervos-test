Nervos 数据结构

1. Cell  

* lock      [Script]
* outPoint  [Point]

2. Script

* codeHash
* args       [array of string]

3. DepCells, InputCells

* blockHash
* cell 

  * txHash
  * index
  
4. OutputCell

* capacity   [string]
* lock       [Script]
* codeHash


CellOutPoint 

* txHash
* index

OutPoint

* CellOutPoint
* blockHash

CellInput

* OutPoint
* since

CellOutput

* capacity
* data
* Script

CellMeta

* CellOutput
* CellOutPoint
