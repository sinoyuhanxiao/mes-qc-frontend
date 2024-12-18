<script>
export const formTreeData = [
  {
    label: '实验室管理',
    children: [
      {
        label: '产品检测',
        children: [
          { label: '微生物' },
          { label: '理化' },
          { label: '感官检测' },
        ],
      },
      {
        label: '原料检测',
        children: [
          { label: '原料内容示例' },
        ],
      },
      {
        label: '辅助检测',
      },
      {
        label: '化学药品管理',
      },
      {
        label: '化学器皿管理',
      },
      {
        label: '计量器具管理',
      },
      {
        label: '污水检测',
      },
    ],
  },
  {
    label: '来料检测（原料）',
    children: [
      {
        label: '来料检测',
        children: [
          { label: '来料基础检测' },
        ],
      },
      {
        label: '库存检验',
        children: [
          { label: '库存基础项目' },
          { label: '出库检验' },
          { label: '上线检测' },
        ],
      },
    ],
  },
  {
    label: '来料检测（辅料）',
    children: [
      { label: '运输车辆卫生' },
      { label: '运输车辆防护' },
      { label: '出厂检测' },
      { label: '产品外观检验' },
      { label: '性能指标检验' },
    ],
  },
  {
    label: '生产过程管控',
    children: [
      { label: '大清洗' },
      { label: '换产停机' },
      { label: '故障停机' },
      { label: '生产过程检测' },
      { label: '首件检测' },
      { label: '包装检测' },
      { label: '贴标检测' },
      { label: '产品相关检测' },
    ],
  },
  {
    label: '成品管控',
    children: [
      { label: '执行管理' },
      { label: '待整改管理' },
      { label: '不合格管理' },
    ],
  },
  {
    label: '异物管理',
  },
];

</script>
