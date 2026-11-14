/* ---------- Dedicated Order export/import --------------------- */

const v175OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v175OrderExportPayloadBase();
  const p=v138EnsureOrderPlan();

  payload.formatVersion=Math.max(Number(payload.formatVersion)||1,3);
  payload.mediaFlowVersion=175;
  payload.orderPlan=payload.orderPlan||{};
  payload.orderPlan.paginateOrderedTitles=!!p.paginateOrderedTitles;
  payload.orderPlan.orderedPageSize=v175OrderPageSize();

  return payload;
};

const v175ImportOrderBase=v142ImportOrder;
v142ImportOrder=async function(file){
  let importedPageSize=null;

  try{
    if(file){
      const data=JSON.parse(await file.text());
      const raw=data?.orderPlan&&typeof data.orderPlan==='object'
        ?data.orderPlan
        :data;

      if(raw?.orderedPageSize!=null){
        importedPageSize=v175ClampPageSize(raw.orderedPageSize,50);
      }
    }
  }catch(_){}

  await v175ImportOrderBase(file);

  if(importedPageSize!==null){
    const p=v138EnsureOrderPlan();
    p.orderedPageSize=importedPageSize;
    v138TouchOrderPlan();

    const ui=v173OrderUI();
    ui.v173AllPage=0;
    ui.v173CategoryPages={};

    render();
  }
};
App.v142ImportOrder=v142ImportOrder;

