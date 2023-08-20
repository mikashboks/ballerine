import { IWorkflowAdapter } from '@/collection-flow/workflow-adapters/abstract-workflow-adapter';
import { KYBParentKYCSessionExampleFlowData } from '@/collection-flow/workflow-adapters/kyb_parent_kyc_session_example/kyb_parent_kyc_session_example.model';
import { KYBParentKYCSessionExampleContext } from '@/workflow/types';
import { Customer, WorkflowRuntimeData } from '@prisma/client';

export class KYBParentKYCSessionExampleAdapter
  implements IWorkflowAdapter<KYBParentKYCSessionExampleFlowData>
{
  serialize(workflow: WorkflowRuntimeData): KYBParentKYCSessionExampleFlowData {
    const flowData = new KYBParentKYCSessionExampleFlowData();
    const context = workflow.context as KYBParentKYCSessionExampleContext;

    flowData.id = workflow.id;
    flowData.flowData = context?.entity?.data?.dynamicInfo || {};
    flowData.flowState = context?.entity?.data?.__stateKey || null;
    flowData.status = workflow.state;
    flowData.isFinished = context?.entity?.data?.__isFinished || false;
    flowData.documents = context?.documents;
    flowData.ubos = (context.entity.data?.additionalInfo?.ubos || []).map(ubo => ({
      id: ubo.entity.id,
      firstName: ubo.entity.data.firstName,
      lastName: ubo.entity.data.lastName,
      birthDate: ubo.entity.data.dateOfBirth,
      title: ubo.entity.data.title,
      email: ubo.entity.data.email,
    }));
    flowData.entityData = {
      website: context.entity?.data?.website,
      registrationNumber: context.entity?.data?.registrationNumber,
      companyName: context.entity?.data?.companyName,
      countryOfIncorporation: context.entity?.data.countryOfIncorporation,
      fullAddress: context.entity?.data?.address?.text,
    };

    // TO DO: Implement mapping of WF issues and then remove this
    flowData.workflow = workflow;

    return flowData;
  }

  deserialize(
    payload: KYBParentKYCSessionExampleFlowData,
    baseWorkflowRuntimeData: WorkflowRuntimeData,
    customer: Customer,
  ): WorkflowRuntimeData {
    const { flowData, flowState, mainRepresentative, entityData, documents, ubos, isFinished } =
      payload;

    (baseWorkflowRuntimeData.context as KYBParentKYCSessionExampleContext).entity = {
      ...(baseWorkflowRuntimeData.context as KYBParentKYCSessionExampleContext).entity,
      data: {
        ...baseWorkflowRuntimeData.context.entity.data,
        ...{
          website: entityData?.website,
          registrationNumber: entityData?.registrationNumber,
          companyName: entityData?.companyName,
          countryOfIncorporation: entityData?.countryOfIncorporation,
          address: { text: entityData?.fullAddress },
        },
        additionalInfo: {
          ...baseWorkflowRuntimeData.context.entity.data.additionalInfo,
          mainRepresentative,
          ubos: ubos.map(ubo => ({
            entity: {
              id: ubo.id,
              type: 'individual',
              data: {
                firstName: ubo.firstName,
                lastName: ubo.lastName,
                email: ubo.email,
                dateOfBirth: ubo.birthDate,

                additionalInfo: {
                  companyName: customer.name,
                  customerCompany: customer.displayName,
                  title: ubo.title,
                },
              },
            },
          })),
        },

        dynamicInfo: flowData,
        __stateKey: flowState,
        __isFinished: isFinished,
      },
    };

    baseWorkflowRuntimeData.context.documents = documents.map(document => {
      return {
        id: document.id,
        category: document.category,
        type: document.type,
        // TO DO: This should use incorporation country code
        issuer: {
          country: 'GH',
        },
        decision: { status: '', revisionReason: '', rejectionReason: '' },
        pages: [{ ballerineFileId: document.fileId }],
        properties: document.properties,
        version: '1',
        issuingVersion: 1,
      };
    });

    return baseWorkflowRuntimeData;
  }
}