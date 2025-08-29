#!/usr/bin/env node

/**
 * Supabase Schema Extraction Script
 * Extracts complete database schema, RLS policies, storage buckets, and API info
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class SupabaseSchemaExtractor {
  constructor() {
    this.output = {
      timestamp: new Date().toISOString(),
      project_info: {},
      database_schema: {},
      tables: {},
      rls_policies: {},
      storage_buckets: {},
      auth_settings: {},
      api_info: {},
      functions: {},
      triggers: {},
      indexes: {},
      constraints: {},
      sample_data: {}
    };
  }

  async extractProjectInfo() {
    console.log('📊 Extracting project information...');
    
    try {
      // Get project settings via SQL
      const { data: settings, error } = await supabase
        .from('pg_settings')
        .select('name, setting')
        .in('name', ['server_version', 'shared_preload_libraries', 'timezone']);

      if (!error && settings) {
        this.output.project_info.postgres_settings = settings;
      }

      // Get database info
      const { data: dbInfo, error: dbError } = await supabase.rpc('get_database_info');
      if (!dbError && dbInfo) {
        this.output.project_info.database_info = dbInfo;
      }

    } catch (error) {
      console.error('⚠️  Error extracting project info:', error.message);
    }
  }

  async extractDatabaseSchema() {
    console.log('🗄️  Extracting database schema...');

    try {
      // Get all schemas
      const { data: schemas, error: schemaError } = await supabase.rpc('get_schemas');
      if (!schemaError && schemas) {
        this.output.database_schema.schemas = schemas;
      }

      // Get all tables with detailed information
      const { data: tables, error: tableError } = await supabase
        .rpc('get_table_info');
        
      if (!tableError && tables) {
        this.output.database_schema.tables = tables;
      }

      // Get all columns
      const { data: columns, error: columnError } = await supabase
        .rpc('get_column_info');
        
      if (!columnError && columns) {
        this.output.database_schema.columns = columns;
      }

    } catch (error) {
      console.error('⚠️  Error extracting database schema:', error.message);
    }
  }

  async extractTables() {
    console.log('📋 Extracting table structures...');

    const publicTables = [
      'users', 'vehicles', 'races', 'race_participants', 
      'meetups', 'meetup_participants', 'friends', 'friend_requests',
      'notifications', 'performance_records', 'race_results'
    ];

    for (const tableName of publicTables) {
      try {
        console.log(`  📄 Processing table: ${tableName}`);

        // Get table structure
        const { data: structure, error: structError } = await supabase
          .rpc('describe_table', { table_name: tableName });

        if (!structError && structure) {
          this.output.tables[tableName] = {
            structure: structure,
            row_count: 0,
            sample_data: []
          };

          // Get row count
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (!countError) {
            this.output.tables[tableName].row_count = count || 0;
          }

          // Get sample data (first 5 rows)
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(5);

          if (!sampleError && sampleData) {
            this.output.tables[tableName].sample_data = sampleData;
          }
        }

      } catch (error) {
        console.error(`⚠️  Error processing table ${tableName}:`, error.message);
        this.output.tables[tableName] = { error: error.message };
      }
    }
  }

  async extractRLSPolicies() {
    console.log('🔒 Extracting RLS policies...');

    try {
      const { data: policies, error } = await supabase.rpc('get_rls_policies');
      
      if (!error && policies) {
        // Group policies by table
        const policiesByTable = {};
        policies.forEach(policy => {
          if (!policiesByTable[policy.tablename]) {
            policiesByTable[policy.tablename] = [];
          }
          policiesByTable[policy.tablename].push(policy);
        });
        
        this.output.rls_policies = policiesByTable;
      }

    } catch (error) {
      console.error('⚠️  Error extracting RLS policies:', error.message);
    }
  }

  async extractStorageBuckets() {
    console.log('🪣 Extracting storage buckets...');

    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (!error && buckets) {
        this.output.storage_buckets.buckets = buckets;

        // Get bucket policies
        for (const bucket of buckets) {
          try {
            const { data: policies, error: policyError } = await supabase.rpc('get_storage_policies', {
              bucket_name: bucket.name
            });

            if (!policyError && policies) {
              this.output.storage_buckets[bucket.name] = {
                ...bucket,
                policies: policies
              };
            }
          } catch (bucketError) {
            console.error(`⚠️  Error getting policies for bucket ${bucket.name}:`, bucketError.message);
          }
        }
      }

    } catch (error) {
      console.error('⚠️  Error extracting storage buckets:', error.message);
    }
  }

  async extractAuthSettings() {
    console.log('🔐 Extracting auth settings...');

    try {
      const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (!usersError && authUsers) {
        this.output.auth_settings.total_users = authUsers.users.length;
        this.output.auth_settings.sample_users = authUsers.users.slice(0, 3).map(user => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          providers: user.app_metadata?.providers || []
        }));
      }

    } catch (error) {
      console.error('⚠️  Error extracting auth settings:', error.message);
    }
  }

  async extractAPIInfo() {
    console.log('🌐 Extracting API information...');

    try {
      // Test various API endpoints to understand structure
      const endpoints = [
        { name: 'rest_api', path: '/rest/v1/', method: 'GET' },
        { name: 'auth_api', path: '/auth/v1/user', method: 'GET' },
        { name: 'storage_api', path: '/storage/v1/bucket', method: 'GET' }
      ];

      this.output.api_info.base_url = supabaseUrl;
      this.output.api_info.endpoints = {};

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${supabaseUrl}${endpoint.path}`, {
            method: endpoint.method,
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            }
          });

          this.output.api_info.endpoints[endpoint.name] = {
            path: endpoint.path,
            status: response.status,
            accessible: response.ok
          };

        } catch (apiError) {
          this.output.api_info.endpoints[endpoint.name] = {
            path: endpoint.path,
            error: apiError.message
          };
        }
      }

    } catch (error) {
      console.error('⚠️  Error extracting API info:', error.message);
    }
  }

  async extractFunctions() {
    console.log('⚡ Extracting database functions...');

    try {
      const { data: functions, error } = await supabase.rpc('get_functions');
      
      if (!error && functions) {
        this.output.functions = functions;
      }

    } catch (error) {
      console.error('⚠️  Error extracting functions:', error.message);
    }
  }

  async extractIndexes() {
    console.log('📇 Extracting indexes...');

    try {
      const { data: indexes, error } = await supabase.rpc('get_indexes');
      
      if (!error && indexes) {
        // Group indexes by table
        const indexesByTable = {};
        indexes.forEach(index => {
          if (!indexesByTable[index.tablename]) {
            indexesByTable[index.tablename] = [];
          }
          indexesByTable[index.tablename].push(index);
        });
        
        this.output.indexes = indexesByTable;
      }

    } catch (error) {
      console.error('⚠️  Error extracting indexes:', error.message);
    }
  }

  async saveOutput() {
    const outputPath = path.join(__dirname, '../docs/supabase-schema-dump.json');
    const readablePath = path.join(__dirname, '../docs/supabase-schema-report.md');

    console.log('💾 Saving extraction results...');

    // Save JSON dump
    fs.writeFileSync(outputPath, JSON.stringify(this.output, null, 2));
    console.log(`✅ JSON dump saved to: ${outputPath}`);

    // Create readable markdown report
    const markdown = this.generateMarkdownReport();
    fs.writeFileSync(readablePath, markdown);
    console.log(`✅ Markdown report saved to: ${readablePath}`);
  }

  generateMarkdownReport() {
    const md = [];
    
    md.push('# Supabase Project Schema Report');
    md.push(`Generated: ${this.output.timestamp}`);
    md.push(`Project URL: ${supabaseUrl}`);
    md.push('');

    // Project Info
    md.push('## Project Information');
    md.push(JSON.stringify(this.output.project_info, null, 2));
    md.push('');

    // Tables
    md.push('## Database Tables');
    Object.entries(this.output.tables).forEach(([tableName, info]) => {
      md.push(`### ${tableName}`);
      md.push(`- Row Count: ${info.row_count || 0}`);
      md.push(`- Structure: ${info.structure ? 'Available' : 'Not extracted'}`);
      md.push(`- Sample Data: ${info.sample_data?.length || 0} rows`);
      md.push('');
    });

    // RLS Policies
    md.push('## Row Level Security Policies');
    Object.entries(this.output.rls_policies).forEach(([tableName, policies]) => {
      md.push(`### ${tableName}`);
      md.push(`- Policies: ${policies.length}`);
      policies.forEach(policy => {
        md.push(`  - ${policy.policyname}: ${policy.cmd} (${policy.roles?.join(', ') || 'No roles'})`);
      });
      md.push('');
    });

    // Storage
    md.push('## Storage Buckets');
    if (this.output.storage_buckets.buckets) {
      this.output.storage_buckets.buckets.forEach(bucket => {
        md.push(`- ${bucket.name}: ${bucket.public ? 'Public' : 'Private'}`);
      });
    }
    md.push('');

    // Auth
    md.push('## Authentication');
    md.push(`- Total Users: ${this.output.auth_settings.total_users || 0}`);
    md.push('');

    // API Info
    md.push('## API Endpoints');
    Object.entries(this.output.api_info.endpoints || {}).forEach(([name, info]) => {
      md.push(`- ${name}: ${info.accessible ? '✅' : '❌'} (${info.status || 'No status'})`);
    });

    return md.join('\n');
  }

  async extract() {
    console.log('🚀 Starting Supabase schema extraction...');
    console.log(`📍 Project URL: ${supabaseUrl}`);
    console.log('');

    try {
      await this.extractProjectInfo();
      await this.extractDatabaseSchema();
      await this.extractTables();
      await this.extractRLSPolicies();
      await this.extractStorageBuckets();
      await this.extractAuthSettings();
      await this.extractAPIInfo();
      await this.extractFunctions();
      await this.extractIndexes();
      
      await this.saveOutput();
      
      console.log('');
      console.log('✅ Schema extraction completed successfully!');
      console.log('📄 Check the generated files in the docs/ directory');
      
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      process.exit(1);
    }
  }
}

// Create RPC functions for data extraction (if they don't exist)
async function createExtractionFunctions() {
  console.log('⚙️  Setting up extraction functions...');

  const functions = [
    {
      name: 'get_schemas',
      sql: `
        CREATE OR REPLACE FUNCTION get_schemas()
        RETURNS TABLE(schema_name text)
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT schema_name::text 
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast');
        $$;
      `
    },
    {
      name: 'get_table_info',
      sql: `
        CREATE OR REPLACE FUNCTION get_table_info()
        RETURNS TABLE(
          table_schema text,
          table_name text,
          table_type text,
          is_insertable_into text
        )
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT 
            table_schema::text,
            table_name::text,
            table_type::text,
            is_insertable_into::text
          FROM information_schema.tables 
          WHERE table_schema = 'public';
        $$;
      `
    },
    {
      name: 'get_column_info',
      sql: `
        CREATE OR REPLACE FUNCTION get_column_info()
        RETURNS TABLE(
          table_name text,
          column_name text,
          data_type text,
          is_nullable text,
          column_default text
        )
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT 
            table_name::text,
            column_name::text,
            data_type::text,
            is_nullable::text,
            column_default::text
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        $$;
      `
    },
    {
      name: 'describe_table',
      sql: `
        CREATE OR REPLACE FUNCTION describe_table(table_name text)
        RETURNS TABLE(
          column_name text,
          data_type text,
          is_nullable text,
          column_default text,
          character_maximum_length integer
        )
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT 
            column_name::text,
            data_type::text,
            is_nullable::text,
            column_default::text,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position;
        $$;
      `
    },
    {
      name: 'get_rls_policies',
      sql: `
        CREATE OR REPLACE FUNCTION get_rls_policies()
        RETURNS TABLE(
          schemaname text,
          tablename text,
          policyname text,
          permissive text,
          roles text[],
          cmd text,
          qual text,
          with_check text
        )
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT 
            schemaname::text,
            tablename::text,
            policyname::text,
            permissive::text,
            roles,
            cmd::text,
            qual::text,
            with_check::text
          FROM pg_policies 
          WHERE schemaname = 'public';
        $$;
      `
    }
  ];

  for (const func of functions) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: func.sql });
      if (error) {
        console.log(`⚠️  Function ${func.name} may already exist or failed to create`);
      }
    } catch (error) {
      console.log(`⚠️  Could not create function ${func.name}`);
    }
  }
}

// Main execution
async function main() {
  try {
    await createExtractionFunctions();
    const extractor = new SupabaseSchemaExtractor();
    await extractor.extract();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SupabaseSchemaExtractor };