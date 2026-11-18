export const mechanicalFields=[
 ['tamano_letra','حجم الخط',10,3,30,.5],['altura_letra','ارتفاع النص (+ بارز / − محفور)',1,-12,5,.1],
 ['alto','سماكة القطعة Z',6,6,12,.5],['ancho','عرض القطعة Y',12,6,40,.5],['largo','طول القطعة X',15,5,40,.5],
 ['diametro_agujero','قطر تجويف المفصل',10,1,30,.1],['profundidad_agujero','طول تجويف المفصل',5.5,1,20,.1],
 ['diametro','قطر محور المفصل',2,.5,8,.1],['espacio_entre_modelos','المسافة بين القطع',1,.2,5,.1],
 ['diametro_externo_cilindro','قطر حلقة الوصلة الخارجي',6,2,15,.1],['diametro_interno_cilindro','قطر حلقة الوصلة الداخلي',3,1,12,.1],
 ['altura_cilindro','عرض حلقة الوصلة',4,1,15,.1],['separacion_cilindro','إزاحة الحلقة عن القطعة',2,.5,8,.1],
 ['alto_soporte','سماكة دعامة الحلقة',1,.4,5,.1],['largo_soporte','طول دعامة الحلقة',2,.5,10,.1],['tamano_chaflan','شطفة طرف القطعة',1,0,3,.1]
];
export const mechanicalDefaults={project:'mechanical',text:'ALBERTO',mechanicalFont:'Bungee',eslabon_primer_elemento:true,mechanicalMode:'todo',baseColor:'#2E7D32',topColor:'#F5F5DC',...Object.fromEntries(mechanicalFields.map(([key,,value])=>[key,value]))};
