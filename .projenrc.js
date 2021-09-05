const { AwsCdkTypeScriptApp } = require('projen');
const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.121.0',
  defaultReleaseBranch: 'main',
  name: 'eks-mg-lab',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-eks',
    '@aws-cdk/aws-iam',
  ],
  gitignore: [
    'cdk.context.json',
  ],
});
project.synth();