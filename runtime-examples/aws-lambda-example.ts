// AWS Lambda Runtime Example
import { createAppLambda } from '../../MoroJS/src';
import type { LambdaEvent, LambdaContext } from '../../MoroJS/src';

const app = createAppLambda();

// Define routes exactly the same way
app.get('/', (req, res) => {
  return {
    message: 'Hello from MoroJS on AWS Lambda!',
    runtime: 'aws-lambda',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  };
});

app.get('/health', (req, res) => {
  return {
    status: 'healthy',
    runtime: 'aws-lambda',
    lambda: true,
    region: process.env.AWS_REGION
  };
});

app.post('/api/data', (req, res) => {
  return {
    received: req.body,
    runtime: 'aws-lambda',
    method: req.method,
    pathParameters: req.params
  };
});

app.get('/api/user/:id', (req, res) => {
  return {
    userId: req.params.id,
    runtime: 'aws-lambda',
    query: req.query,
    sourceIp: req.ip
  };
});

// Export the handler for AWS Lambda
export const handler = app.getHandler();

// For typed Lambda handler (optional)
export const typedHandler = (event: LambdaEvent, context: LambdaContext) => {
  return app.getHandler()(event, context);
};

/*
To deploy to AWS Lambda:

1. Package your code
2. Set the handler to: index.handler
3. Configure API Gateway to proxy all requests to Lambda
4. Or use AWS SAM template:

AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  MoroJSFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: index.handler
      Runtime: nodejs18.x
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
*/ 