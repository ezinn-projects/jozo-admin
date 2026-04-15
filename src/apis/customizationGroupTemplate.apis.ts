import {
  ICreateCustomizationGroupTemplateRequestBody,
  IFnBCustomizationGroupTemplate,
  IUpdateCustomizationGroupTemplateRequestBody,
} from "@/@types/FnBCustomization";
import http from "@/utils/http";

const CUSTOMIZATION_GROUP_TEMPLATE_CONTROLLER = "/customization-group-templates";

const customizationGroupTemplateApis = {
  getTemplates: () =>
    http.get<HTTPResponse<IFnBCustomizationGroupTemplate[]>>(
      CUSTOMIZATION_GROUP_TEMPLATE_CONTROLLER
    ),
  createTemplate: (payload: ICreateCustomizationGroupTemplateRequestBody) =>
    http.post<HTTPResponse<IFnBCustomizationGroupTemplate>>(
      CUSTOMIZATION_GROUP_TEMPLATE_CONTROLLER,
      payload
    ),
  validateTemplateRefs: (templateKeys: string[]) =>
    http.post<HTTPResponse<{ validTemplateKeys: string[]; invalidTemplateKeys: string[] }>>(
      `${CUSTOMIZATION_GROUP_TEMPLATE_CONTROLLER}/validate-refs`,
      { templateKeys }
    ),
  updateTemplate: (
    templateKey: string,
    payload: IUpdateCustomizationGroupTemplateRequestBody
  ) =>
    http.put<HTTPResponse<IFnBCustomizationGroupTemplate>>(
      `${CUSTOMIZATION_GROUP_TEMPLATE_CONTROLLER}/${templateKey}`,
      payload
    ),
  deleteTemplate: (templateKey: string) =>
    http.delete<HTTPResponse<IFnBCustomizationGroupTemplate>>(
      `${CUSTOMIZATION_GROUP_TEMPLATE_CONTROLLER}/${templateKey}`
    ),
};

export default customizationGroupTemplateApis;
